import pkg_resources
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from .config import (
    get_config, 
    get_site_config
)
import logging
from xblock.fields import Integer, Scope, String, XMLString, Boolean
from django.template import Template, Context
from webob import Response
from .fileupload import get_uploader
from datetime import datetime
import os

logger = logging.getLogger(__name__)

def get_template_path(status):
    if status in ['passed', 'did_not_pass', 'unable_to_review', 'not_graded']:
        return f"templates/submitted.html"
    
    return f"templates/{status}.html"

CSS_PATH = 'static/css/assignmentxblock.css'
JS_PATH = 'static/js/assignmentxblock.js'

@XBlock.needs("i18n")
@XBlock.needs("user")
@XBlock.needs("user_state")
class AssignmentXBlock(XBlock):

    icon_class = "problem"
    non_editable_metadata_fields = []

    public_dir = 'static'

    max_file_size = Integer(
        default=5,
        scope=Scope.settings,
        help="Max file size (mb)",
    )

    allowed_file_types = String(
        default="zip",
        scope=Scope.settings,
        help="Allowed file types"
    )

    total_score = Integer(
        default=5,
        scope=Scope.settings,
        help="Max score"
    )

    html_content = XMLString(
        help="HTML data for the project",
        scope=Scope.content,
        default="<div></div>"
    )

    submission_note = String(
        default="",
        scope=Scope.user_state,
        help="Submission note"
    )

    file_url = String(
        default="",
        scope=Scope.user_state,
        help="The latest uploaded file url"
    )

    file_name = String(
        default="",
        scope=Scope.user_state,
        help="The latest uploaded file name"
    )

    uploaded_successfully = Boolean(
        default=False,
        scope=Scope.user_state,
        help="The latest uploaded file state"
    )

    display_name = String(
        default="Learning Project XBlock", scope=Scope.settings,
        help="Display name"
    )

    is_result_unit = Boolean(
        help="Is Unit which displays Project Result",
        default=True
    )

    def max_score(self):
        return self.total_score

    @property
    def has_score(self):
        return not self.is_result_unit
    
    @property
    def course_id(self):
        return self.scope_ids.usage_id.context_key
    
    @property
    def assignment_name(self):
        return self.get_parent().get_parent().display_name 

    @property
    def in_studio_preview(self):
        return self.scope_ids.user_id is None
    
    @property
    def _(self):
        i18nService = self.runtime.service(self, 'i18n')  # pylint: disable=invalid-name
        return i18nService.ugettext
    
    def resource_string(self, path):
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def student_view(self, context=None):
        context = self._get_general_context()

        context.update({"block": self})
        template_path = "templates/base.html"
        template_str = self.resource_string(template_path)
        template = Template(template_str)
        rendered_html = template.render(Context(context))
        frag = Fragment(rendered_html)
        frag.add_css(self.resource_string(CSS_PATH))
        if self.is_result_unit:
            frag.add_javascript(self.resource_string('static/js/unit_2.js'))
        else: 
            frag.add_javascript(self.resource_string('static/js/unit_1.js'))
            
        frag.initialize_js('AssignmentXBlock')

        return frag
    
    def studio_view(self, context=None):
        context = {
            "is_result_unit": self.is_result_unit,
            "max_file_size": self.max_file_size,
            "html_content": self.html_content,
            "allowed_file_types": self.allowed_file_types,
            "score": self.total_score
        }

        template_path = "templates/studio_view.html"
        template_str = self.resource_string(template_path)
        template = Template(template_str)
        rendered_html = template.render(Context(context))
        frag = Fragment(rendered_html)
        frag.add_css(self.resource_string("static/css/studio_view.css"))
        frag.add_javascript(self.resource_string("static/js/studio_view.js"))
        frag.initialize_js('AssignmentXBlock')
        return frag
    
    def author_view(self, context=None):
        html = self.resource_string("templates/author_view.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string(CSS_PATH))

        return frag

    @XBlock.handler
    def learning_project_upload_file(self, request, suffix=''): 
        file = request.params.get('file')
        file_error = self.validate_file(file)

        response = Response()

        if len(file_error) > 0: 
            response.status_code = 400
            response.content_type = "application/json"
            response.json_body = {
                "message": file_error, 
            }
            return response

        try:
            self.file_name = ''
            self.file_url = ''
            download_url = self._upload_file(file)
            self.file_name = file.filename
            self.file_url = download_url
        except Exception as e:
            logger.error(str(e))
            response.status_code = 500
            response.content_type = "application/json"
            response.json_body = {
                "message": self._('Internal Server Error'), 
            }
            return response

        response.status_code = 200
        response.content_type = "application/json"
        response.json_body = {
            "file_name": self.file_name,
            "file_url": self.file_url,
        }

        return response

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("AssignmentXBlock",
             """<assignmentxblock/>
             """),
            ("Multiple AssignmentXBlock",
             """<vertical_demo>
                <assignmentxblock/>
                <assignmentxblock/>
                <assignmentxblock/>
                </vertical_demo>
             """),
        ]

    def get_user_email(self):
        user_service = self.runtime.service(self, 'user')
        if user_service: 
            current_user = user_service.get_current_user()
            emails = current_user.emails
            try:
                return emails[0]
            except Exception as e:
                logger.error("Can not get user email")
                logger.error(str(e))
                return None
        logger.error("Can not get user email because user_service is None")
        return None

    def validate_file(self, file):
        if self.max_file_size * 1024 * 1024 < file.file.size: 
            return f'{self._("File is too large. The maximum allowed size is")} {self.max_file_size}MB.'

        if " " in file.filename:
            return self._('File name must not contain spaces.')

        file_types = self.allowed_file_types.split(',')
        file_types = list(map(lambda x: x.strip().lower(), file_types))
        file_types = list(filter(lambda x: x != '', file_types))

        ext = file.filename.split('.')[-1:][0].lower()

        if ext not in file_types:
            return f"{self._('Only allow the following file types:')} {', '.join(file_types)}."

        return ''
    
    def _get_file_key(self, file):
        """
        file_key is also file_path, 

        e.g. 
            - filename: file_1.zip
            - prefix: assignments
            - file_key(file_path): assignments/file_1.zip
        """

        prefix = get_config('ASSIGNMENTXBLOCK_FILE_KEY_PREFIX', 'assignments')

        filename, file_extension = os.path.splitext(file.filename  )
        unique_file_key = filename + '_' + str(datetime.now().timestamp()) + file_extension

        return f"{prefix}/{unique_file_key}"
    
    def _upload_file(self, file):
        """
        file_path (file_key): assignments/file_1.zip
        public_url: /media/assignments/file_1.zip with media is django.conf.settings.MEDIA_URL
        """

        # file_path is also file_key
        # so let's call it file_key
        file_key = self._get_file_key(file)

        # TODO: check if file already exists
        uploader = get_uploader()
        download_url = uploader.upload(file_key, file.file)
        self.download_url = download_url

        return download_url
    
    @XBlock.json_handler
    def get_template(self, data, context=None, request=None):

        status = data.get('status')
        context = self._get_general_context()
        if data.get('submission') is not None: 
            if data['submission']['result'] == 'did_not_pass':
                need_to_fix = 0
                for group in data['submission']['responses']:
                    for criterion in group.get('criteria'):
                        if criterion.get('result') != 'passed':
                            need_to_fix += 1

                data['submission']['need_to_fix'] = need_to_fix

        context.update(data)

        if status == 'error':
            template_path = f"templates/error.html"
        elif self.is_result_unit:
            template_path = f"templates/unit_2.html"
        else: 
            template_path = f"templates/unit_1.html"

        template_str = self.resource_string(template_path)
        template = Template(template_str)
        rendered_html = template.render(Context(context))

        return {
            "template": rendered_html
        }

    def _get_general_context(self): 
        # create file_accepts for file input

        LMS_BASE = get_config('LMS_BASE')
        PORTAL_HOST = get_site_config(LMS_BASE, 'PORTAL_HOST', 'localhost:8069')

        # api
        PORTAL_GET_SUBMISSION_URL = f"{PORTAL_HOST}/api/v1/project/user"
        PORTAL_SUBMIT_URL = f"{PORTAL_HOST}/api/v1/project/submission"
        PORTAL_CANCEL_SUBMISSION_URL = f"{PORTAL_HOST}/api/v1/project/submission/cancel"

        file_input_accepts = ', '.join(list(map(lambda ext: f'.{ext}', self.allowed_file_types.split(','))))
        context = {
            "email": self.get_user_email(),
            "is_result_unit": self.is_result_unit,
            "assignment_name": self.assignment_name,
            "course_id": self.course_id,
            "PORTAL_GET_SUBMISSION_URL": PORTAL_GET_SUBMISSION_URL,
            "PORTAL_SUBMIT_URL": PORTAL_SUBMIT_URL,
            "PORTAL_CANCEL_SUBMISSION_URL": PORTAL_CANCEL_SUBMISSION_URL,
            "block": self,
            "max_file_size": self.max_file_size, 
            "allowed_file_types": self.allowed_file_types,
            "score": self.total_score,
            "file_input_accepts": file_input_accepts,
            "html_content": self.html_content,
            "file_name": self.file_name,
            "file_url": self.file_url,
            "uploaded_successfully": self.uploaded_successfully,
            "submission_note": self.submission_note,
            "usage_id": self.scope_ids.usage_id,
            "unit_usage_id": self.get_parent().scope_ids.usage_id
        }

        return context
    
    def get_anonymous_user_id(self, username, course_id):
        return self.runtime.service(self, 'user').get_anonymous_user_id(username, course_id)
    
    @XBlock.json_handler
    def portal_grade(self, data, context=None, request=None):
        result = data.get('result')

        if result: 
            if result == 'passed':
                self.runtime.publish(self, "grade", { "value": self.total_score, "max_value": self.total_score})
            elif result == 'did_not_pass':
                self.runtime.publish(self, "grade", { "value": 0, "max_value": self.total_score})

        return {
            "message": "success"
        }

    @XBlock.json_handler
    def update_settings(self, data, context=None, request=None):
        self.is_result_unit = data.get('is_result_unit')
        self.max_file_size = data.get('max_file_size')
        self.html_content = data.get('html_content')
        self.allowed_file_types =  data.get('allowed_file_types')
        self.total_score = data.get('score')
        return {
            "message": "settings saved"
        }

    @XBlock.json_handler
    def delete_uploaded_file(self, data, context=None, request=None):
        self.file_url = ''
        self.file_name = ''
        self.submission_note = ''
        return {
            "message": "success"
        }

    @XBlock.json_handler
    def save_submission_note(self, data, context=None, request=None):
        self.submission_note = data.get('submission_note')
        return {
            "message": "success"
        }
