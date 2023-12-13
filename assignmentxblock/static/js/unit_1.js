
const LMS_HEADER_HEIGHT = 100; // để khi scroll thì cộng vào
const UNIT_HEIGHT_TRANSITION = 0.2; // để transition đồng bộ khi collapse - expand criteria feedback và submission history

function AssignmentXBlock(runtime, element) {

    $(function ($) {
        /* Here's where you'd do things on page load. */

        init().catch(console.error).finally(() => {
            // resize_unit()
        })
    })

    async function init(submission_id = undefined, additional_data = {}) {

        let initialData = {}
        try {
            initialData = await _get_initial_data(submission_id);
        } catch (error) {
            initialData = {
                status: "error",
                error_message: error
            }
        }
        const template = await _get_template({ ...initialData, ...additional_data });
        _render_template(initialData, template);
    }

    function _get_basic_data() {
        const portalInitialUrl = $('#portal-data', element).data('get-initial-url');
        const email = $('#portal-data', element).data('email');
        const course_code = $('#portal-data', element).data('course-id');
        const assignment_name = $('#portal-data', element).data('assignment-name');
        const portal_submit_url = $('#portal-data', element).data('portal-submit-url');
        const max_file_size = +$('#portal-data', element).data('max-file-size');
        const allowed_file_types = $('#portal-data', element).data('allowed-file-types');

        return {
            portalInitialUrl,
            email,
            course_code,
            assignment_name,
            portal_submit_url,
            max_file_size,
            allowed_file_types
        }
    }

    function _get_initial_data(submission_id = undefined) {
        const data = _get_basic_data();

        const requestData = {
            email: data.email,
            course_code: data.course_code,
            project_name: data.assignment_name,
            submission_id
        }

        const headers = { "Content-Type": "application/json" }

        const url = data.portalInitialUrl;

        return new Promise((res, rej) => {
            // uuuuv Need to change here for prod
            // $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
            //     delete options.headers['X-Csrftoken'];
            //     delete options.headers['x-csrftoken'];
            //     delete options.headers['X-CSRFToken'];
            // });

            $.ajax({
                url: url,
                type: "POST",
                data: JSON.stringify(requestData),
                // xhrFields: {
                //     withCredentials: true
                // },
                headers,
                success: function (response) {
                    res(response.data)
                },
                error: function (xhr, status, error) {
                    console.error(xhr, status, error);
                    if (xhr.responseJSON) {
                        if (typeof xhr.responseJSON.message === 'string') {
                            rej(xhr.responseJSON.message);
                        }

                        if (typeof xhr.responseJSON.error === 'string') {
                            rej(xhr.responseJSON.error);
                        }
                    }
                    rej("Internal Server Error");
                },
            });
        })
    }

    function _get_template(initialData) {
        return new Promise((res, rej) => {
            $.ajax({
                url: runtime.handlerUrl(element, 'get_template'),
                type: "POST",
                data: JSON.stringify(initialData),
                headers: { "Content-Type": "application/json" },
                success: function (response) {
                    res(response.template)
                },
                error: function (xhr, status, error) {
                    console.error(xhr, status, error);
                    rej(error)
                },
            });
        })
    }

    function _render_template(data, template) {
        $('#learningprojectxblock', element).html(template);

        const status = data.status;
        const submissions = data?.submissions;


        if (status === "has_not_submitted") {
            init_submit_handlers();
        } else if (status === "unable_to_review") {
            init_submit_handlers();
            _init_ressubmit_btn_handler()
            _render_submission_date(data.submission.date * 1000)
        } else if (status === "not_graded") {
            _render_submission_date(data.submission.date * 1000)
            _init_cancel_submission_handler()
        } else if (status === "passed") {
            _render_submission_date(data.submission.date * 1000)
        } else if (status === "did_not_pass") {
            init_submit_handlers();
            _init_ressubmit_btn_handler()
            _render_submission_date(data.submission.date * 1000)
        } else {
            // internal_server_error
            // do nothing
        }

        _toggle_loading_modal(false);
    }


    function init_submit_handlers() {
        _init_file_input_handlers();
        _init_term_inputs_handlers();

        $("#submit-form", element).submit((e) => {
            e.preventDefault();
            submit();
        });
    }

    function _init_file_input_handlers() {
        $("#file-input").change(function (eventObject) {
            common_msg('')
            const files = Array.from(eventObject.target.files);

            if (files.length > 1) return;

            const file = files[0];

            if (!file) {
                _toggle_display("#file-upload-preview", false)
                _toggle_display("label[for=file-input]", true)
                $("#chosen-file-name", element).text("");
            } else {
                _toggle_display("#file-upload-preview", true)
                _toggle_display("label[for=file-input]", false)
                $("#chosen-file-name", element).text(file.name);
            }

            const fileErrorMsg = _file_is_valid(file);
            common_msg(fileErrorMsg, 'error')
            // _toggle_file_error_msg(fileErrorMsg);

            if (fileErrorMsg) return;

            _upload_file().then(res => {
                _toggle_next_step_to_submit(true);
            }).catch(msg => {
                // _toggle_file_error_msg(msg)
                console.log(msg)
                common_msg(msg, 'error')
                _toggle_next_step_to_submit(false);
            })
            // _toggle_next_step_to_submit(fileErrorMsg === '');

            // if (_is_valid_to_submit(element)) {
            //     $("#submit-btn", element).removeClass("lpx-btn-disabled");
            // } else {
            //     $("#submit-btn", element).addClass("lpx-btn-disabled");
            // }

            // resize_unit();
        });

        $("#remove-file-btn", element).click(function () {
            console.log('start delete file')

            if ($('#portal-data', element).data('file-url')) {
                console.log('has uploaded file')
                _delete_file().then(() => {
                    _removed_file_successfully()
                }).catch(error => {
                    console.log('failed to delete file')
                    // _toggle_file_error_msg(error)
                    common_msg(error, 'error')
                })
            } else {
                _removed_file_successfully()
            }

            function _removed_file_successfully() {
                $('#portal-data', element).data('file-name', '')
                $('#portal-data', element).data('file-url', '')
                $('#portal-data', element).data('submission-note', '')

                // disable and hide submit btn
                $("#submit-btn", element).addClass("lpx-btn-disabled");
                _toggle_display("#submit-btn", false);

                // set file input value to empty
                $("#file-input", element).val("");

                // show choose file btn
                _toggle_display("label[for=file-input]", true);

                // hide file upload preview and remove file name from it
                _toggle_display("#file-upload-preview", false);
                $("#chosen-file-name", element).text("");

                // hide terms and uncheck all term items
                _toggle_terms(false);

                // hide submission notes, still keep its content
                _toggle_display("#submission-note-container", false);

                // clear the file error message if there is one
                // _toggle_file_error_msg('');
                common_msg('')
                _toggle_submit_error('')

                // resize
                resize_unit();
            }


        });
    }

    function _toggle_display(selector, should_show) {
        if (should_show) {
            $(selector, element).removeClass('d-none')
        } else {
            $(selector, element).addClass('d-none')
        }
    }

    function _toggle_terms(should_show) {
        if (should_show) {
            _toggle_display('#terms', true);
        } else {
            _toggle_display('#terms', false);
            _uncheck_all_term_items();
        }
    }

    function _uncheck_all_term_items() {
        $('.term-item input', element).each(function (_) {
            this.checked = false;
        })

        $('.term-item', element).each(function (_) {
            this.classList.remove('checked');
        })
    }

    function _toggle_file_error_msg(msg) {
        const container = $("#file-error-message", element);
        const text = $("#file-error-message span", element);
        if (msg) {
            text.text(msg);
            container.removeClass("d-none");
        } else {
            text.text("");
            container.addClass("d-none");
        }
    }

    function _toggle_next_step_to_submit(should_show) {
        if (should_show) {
            _toggle_terms(true)
            _toggle_display('#submission-note-container', true);
            _toggle_display('#submit-btn', true);
        } else {
            _toggle_display('#terms', false);
            _toggle_display('#submission-note-container', false);
            _toggle_display('#submit-btn', false);
        }
        resize_unit()
    }

    function _init_term_inputs_handlers() {
        $(".term-item input", element).each(function () {
            $(this).on("change", function () {
                const is_checked = $(this).prop('checked');

                const term_item = $(this).parentsUntil('.term-item').parent();

                if (is_checked) {
                    term_item.addClass('checked');
                } else {
                    term_item.removeClass('checked')
                }

                if (_is_valid_to_submit()) {
                    $("#submit-btn", element).removeClass("lpx-btn-disabled");
                } else {
                    $("#submit-btn", element).addClass("lpx-btn-disabled");
                }
            });
        });
    }

    function _file_is_valid(file) {
        const basic_data = _get_basic_data();
        const ALLOWED_FILE_TYPES = basic_data.allowed_file_types.split(',').map(item => item.trim())
        const MAX_FILE_SIZE = basic_data.max_file_size;

        const ext = file.name.split(".").pop().toLowerCase();

        if (!ALLOWED_FILE_TYPES.includes(ext)) {
            return `${gettext('Only the following file types are allowed:')} ${basic_data.allowed_file_types}`;

        } else if (file.size > MAX_FILE_SIZE * 1024 * 1024) {

            return `${gettext('File is too large. Only allowed maximum')} ${MAX_FILE_SIZE}mb`;
        }

        return "";
    }

    function _is_valid_to_submit() {
        console.log('_is_valid_to_submit')
        let allTermsAreChecked = true;

        $(".term-item input", element).each(function () {
            const isChecked = $(this).prop("checked");
            if (!isChecked) allTermsAreChecked = false;
        });

        if (!allTermsAreChecked) return false;

        const file_url = $('#portal-data', element).data('file-url')
        return !!file_url
    }

    function submit() {

        // _toggle_loading_modal(true);
        _toggle_submit_error("")
        _submit_to_portal().then(() => {
            localStorage.setItem('should_scroll_to_status_position', '1')
            _post_message({
                reload: true
            })
            _delete_file().catch(console.error)
            init(undefined, {
                client_common_message: gettext('You submitted your assignment successfully'),
                client_common_message_state: 'success'
            }).catch(console.error)

        }).catch(error => {
            _toggle_loading_modal(false);
            _toggle_submit_error(error);
        });

    }

    function _upload_file() {
        const file = Array.from($("#file-input", element).prop("files"))[0];
        const formData = new FormData();
        formData.append('file', file);
        _togger_uploading_file(true)
        return new Promise((res, rej) => {
            $.ajax({
                url: runtime.handlerUrl(element, "learning_project_upload_file"),
                data: formData,
                type: 'POST',
                processData: false,
                contentType: false,
                success: function (response) {
                    $('#portal-data').data('file-url', response.file_url)
                    $('#portal-data').data('file-name', response.file_name)
                    res(response);
                    _togger_uploading_file(false)
                }, error: function (xhr, status, error) {
                    console.error(xhr, status, error);

                    if (xhr.responseJSON) {
                        if (xhr.status === 413 && xhr?.responseJSON?.success) {
                            rej(xhr.responseJSON.success);
                        }
                        rej(xhr.responseJSON.message);
                    }
                    rej("Internal Server Error");
                    _togger_uploading_file(false)
                }
            })
        })
    }

    function _submit_to_portal() {

        return new Promise((res, rej) => {
            _save_submission_note().then(submission_note => {
                const basic_data = _get_basic_data(element);

                const requestData = {
                    username: basic_data.username || 'edx',
                    project_name: basic_data.assignment_name,
                    email: basic_data.email,
                    submission_url: $('#portal-data', element).data('file-url'),
                    submission_note: submission_note,
                    course_code: basic_data.course_code,
                };

                $.ajax({
                    url: basic_data.portal_submit_url,
                    type: "POST",
                    data: JSON.stringify(requestData),
                    contentType: "application/json",
                    // xhrFields: {
                    //     withCredentials: true
                    // },
                    success: function (response) {
                        res(response);
                    },
                    error: function (xhr, status, error) {
                        console.error(xhr, status, error);

                        if (xhr?.responseJSON?.message) {
                            rej(xhr.responseJSON.message);
                        } else {
                            rej("Internal Server Error");
                        }
                    },
                });
            }).catch(msg => rej(msg))

        });
    }

    function _reload() {
        window.location.reload();
    }

    function _toggle_loading_modal(should_show) {
        if (should_show) {
            $("#loading-modal", element).removeClass("d-none");
        } else {
            $("#loading-modal", element).addClass("d-none");
        }
    }

    function _toggle_submit_error(message) {
        if (message === "") {
            $("#submit-error-message", element).addClass("d-none");
            $("#submit-error-message", element).text("");
        } else {
            $("#submit-error-message", element).removeClass("d-none");
            $("#submit-error-message", element).text(message);
        }
    }


    function scroll_to_top(top) {

        let position;
        if (typeof top === 'undefined') {
            position = element.getBoundingClientRect().top + window.scrollY - LMS_HEADER_HEIGHT // 100 is for header height
        } else {
            position = top
        }

        _post_message({
            scroll: {
                top: position
            }
        })
    }

    function resize_unit(offset = 0, transition = "none") {
        _post_message({
            resize: {
                iframeHeight: $('#content').prop('scrollHeight') + offset,
                transition: transition
            }
        })
    }

    function _post_message(data) {
        window.parent.postMessage({ type: 'learningprojectxblock', unit_usage_id: $('#portal-data', element).data('unit-usage-id'), ...data }, "*")
    }

    function _render_submission_date(timestamp) {
        $('#submission-status-date span', element).text(new Date(timestamp).toLocaleString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        }))
    }

    function _togger_uploading_file(should_show) {
        if (should_show) {
            $('#uploading-file', element).removeClass('d-none')
        } else {
            $('#uploading-file', element).addClass('d-none')
        }
    }

    function _init_cancel_submission_handler() {

        $('#cancel_submission_btn', element).click(function () {
            $.ajax({
                url: $('#portal-data', element).data('portal-cancel-submission-url'),
                type: "POST",
                data: JSON.stringify({
                    submission_id: $(this).data('submission-id'),
                    email: $('#portal-data', element).data('email')
                }),
                // xhrFields: {
                //     withCredentials: true
                // },
                headers: { "Content-Type": "application/json" },
                success: function (response) {
                    _delete_file().catch(console.error)
                    init(undefined, { should_show_resubmit: true, client_common_message: gettext('You have successfully canceled'), client_common_message_state: 'success' }).catch(console.error)
                },
                error: function (xhr, status, error) {
                    let cancel_error = ''
                    if (xhr.responseJSON) {
                        if (typeof xhr.responseJSON.message === 'string') {
                            cancel_error = xhr.responseJSON.message
                        }

                        if (typeof xhr.responseJSON.error === 'string') {
                            cancel_error = xhr.responseJSON.error
                        }
                    } else {
                        cancel_error = gettext('Internal Server Error')
                    }

                    console.error(cancel_error)
                    common_msg(cancel_error, 'error')
                },
            });
        })
    }

    function _delete_file() {
        return new Promise((res, rej) => {
            $.ajax({
                url: runtime.handlerUrl(element, 'delete_uploaded_file'),
                type: "POST",
                data: JSON.stringify({}),
                headers: { "Content-Type": "application/json" },
                success: function (response) {
                    res(true)
                },
                error: function (xhr, status, error) {
                    console.error(xhr, status, error);
                    rej(error)
                },
            });
        })

    }

    function _save_submission_note() {
        const submission_note = $('#submission-note', element).val()
        return new Promise((res, rej) => {
            $.ajax({
                url: runtime.handlerUrl(element, "save_submission_note"),
                data: JSON.stringify({
                    submission_note
                }),
                type: 'POST',
                processData: false,
                success: function () {
                    $('#portal-data', element).data('submission-note', submission_note)
                    res(submission_note);
                }, error: function (xhr, status, error) {
                    console.error(xhr, status, error);

                    if (xhr.responseJSON) {
                        if (xhr.status === 413 && xhr?.responseJSON?.success) {
                            rej(xhr.responseJSON.success);
                        }
                        rej(xhr.responseJSON.message);
                    }
                    rej("Internal Server Error");
                }
            })
        })
    }

    function common_msg(msg, state) {
        const ele = $('#common-message', element)
        const ele_text = $('#common-message span', element)

        if (!msg) {
            ele.addClass('d-none')
            ele_text.text('')
        } else {
            ele_text.text(msg)
            if (state === 'error') {
                ele.removeClass('success')
                ele.addClass('error')
            } else {
                ele.removeClass('error')
                ele.addClass('success')
            }
            ele.removeClass('d-none')
        }
    }

    function _init_ressubmit_btn_handler() {
        $('#resubmit-btn', element).click(function () {
            $(this).addClass('d-none')
            $('#resubmit-container', element).removeClass('d-none')
        })
    }

}























