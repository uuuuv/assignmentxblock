
const LMS_HEADER_HEIGHT = 100; // để khi scroll thì cộng vào
const UNIT_HEIGHT_TRANSITION = 0.2; // để transition đồng bộ khi collapse - expand criteria feedback và submission history

function AssignmentXBlock(runtime, element) {

    class SubmissionHistorySelect {
        constructor(obj) {
            const {
                MAIN_ID,
                SVG,
                PLACEHOLDER,
                NO_OPTION_FOUND,
                chosenValue,
                OPTIONS,
                OPTION_HANDLER,
                view,
            } = obj || {};

            this.MAIN_ID = MAIN_ID || "submission_history";
            this.PLACEHOLDER = PLACEHOLDER || gettext('Select project');
            this.NO_OPTION_FOUND = NO_OPTION_FOUND || gettext('No project found');
            this.SVG =
                SVG ||
                `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 14.95c-.133 0-.258-.02-.374-.062a.877.877 0 0 1-.325-.213l-4.6-4.6a.948.948 0 0 1-.275-.7c0-.283.091-.516.275-.7a.948.948 0 0 1 .7-.275c.283 0 .516.092.7.275l3.9 3.9 3.9-3.9a.948.948 0 0 1 .7-.275c.283 0 .516.092.7.275a.948.948 0 0 1 .275.7.948.948 0 0 1-.275.7l-4.6 4.6c-.1.1-.209.171-.325.213a1.106 1.106 0 0 1-.375.062z" fill="#8097B1"/>
                </svg>`;

            this.INPUT_ID = `${this.MAIN_ID}-input`;
            this.SELECT_ID = `${this.MAIN_ID}-select`;
            this.SVG_CONTAINER_ID = `${this.MAIN_ID}-svg-container`;
            this.OPTIONS_ID = "submission_history-options";
            this.OPTIONS_CONTAINER_ID = "history-options-container";
            this.OPTION_CLASS = "submission_history-option";
            this.chosenValue = chosenValue || "";
            this.OPTIONS = OPTIONS || [];
            this.OPTION_HANDLER =
                OPTION_HANDLER ||
                function () {
                    console.log("trigger option handler");
                };

            this.view = view;
        }

        init() {
            this.renderSkeleton();
        }

        // render methods
        renderSkeleton() {
            const container = this.getEleById(this.MAIN_ID);
            const select = this.renderSelect();
            container.appendChild(select);
        }

        renderSelect() {
            const select = this.createEle("div");
            select.id = this.SELECT_ID;
            select.onclick = (e) => this.onClickSelectHandler(e.currentTarget);

            const input = this.renderInput();

            const svgContainer = this.createEle("span");
            svgContainer.id = this.SVG_CONTAINER_ID;
            svgContainer.innerHTML = this.SVG;

            select.appendChild(input);
            select.appendChild(svgContainer);

            return select;
        }

        renderInput() {
            const input = this.createEle("input");
            input.id = this.INPUT_ID;
            input.placeholder = gettext('Submission date: ') + this.chosenValue.date;
            input.value = this.chosenValue.date;

            input.oninput = (e) => this.onInputChangeHandler(e.target.value.trim());

            return input;
        }

        renderOptions(options) {
            const ul = this.createEle("ul");
            ul.id = this.OPTIONS_ID;
            options.forEach((option) => {
                const optionEle = this.createOptionEle(option);
                ul.appendChild(optionEle);
            });

            const container = document.createElement('div')
            container.id = this.OPTIONS_CONTAINER_ID
            if (options.length > 3) {
                container.classList.add('overflow')
            }
            container.appendChild(ul);

            this.getEleById(this.MAIN_ID).appendChild(container);
            // this.getEleById(this.MAIN_ID).appendChild(ul);
            // resize_unit(60, ".2s")

        }

        createOptionEle(val) {
            const li = this.createEle("li");
            li.classList.add(this.OPTION_CLASS);

            if (typeof val === 'string') {
                // no option found
                li.innerText = val
            } else {
                li.innerText = val.date;
                li.onclick = () => {
                    this.chosenValue = val;
                    this.removeOptions();
                    this.OPTION_HANDLER(val);
                };

                if (this.chosenValue == val) {
                    li.classList.add('is-current-submission')
                }
            }

            return li;
        }

        removeOptions() {
            const optionsContainer = this.getEleById(this.OPTIONS_CONTAINER_ID);
            if (optionsContainer) {
                const containerHeight = document.getElementById(this.MAIN_ID).offsetHeight;
                // document.getElementById(this.MAIN_ID).style.height = `${containerHeight - optionsContainer.offsetHeight}px`
                optionsContainer.remove();
                // resize_unit(0, ".2s")
            }

        }

        // helpers
        createEle(ele) {
            return document.createElement(ele);
        }

        getEleById(id) {
            return document.getElementById(id);
        }

        // event handler
        _clickOutsideHandler() {
            this.getEleById(this.INPUT_ID).value = this.chosenValue.date;
            this.getEleById(this.SELECT_ID).classList.remove("is--focus");
            this.removeOptions();

        }

        onInputChangeHandler(val) {
            const optionsContainer = this.getEleById(this.OPTIONS_ID);

            if (!optionsContainer) return;

            let filterOptions = this.OPTIONS.filter((item) => item.date.includes(val));
            if (!filterOptions.length) filterOptions = [this.NO_OPTION_FOUND];
            this.removeOptions();
            this.renderOptions(filterOptions);
        }

        onClickSelectHandler(select) {
            select.classList.toggle("is--focus");
            const optionsEle = this.getEleById(this.OPTIONS_ID);
            if (optionsEle) {
                this.getEleById(this.INPUT_ID).blur();
                this.removeOptions();
            } else {
                this.getEleById(this.INPUT_ID).focus();
                this.getEleById(this.INPUT_ID).value = '';
                this.renderOptions(this.OPTIONS);

                document.addEventListener(
                    "click",
                    this.clickOutsideSelectContainerHandler
                );

                window.addEventListener("blur", this.onBlurIframeHandler);
            }
        }

        onBlurIframeHandler = () => {
            this._clickOutsideHandler();
        };

        clickOutsideSelectContainerHandler = (e) => {
            const container = this.getEleById(this.MAIN_ID);
            if (!container.contains(e.target)) {
                this._clickOutsideHandler();
            }
        };

        clearEventListeners() {
            document.removeEventListener(
                "click",
                this.clickOutsideSelectContainerHandler
            );

            window.removeEventListener("blur", this.onBlurIframeHandler);
        }
    }

    $(function ($) {
        /* Here's where you'd do things on page load. */
        init().then(() => {
            if (localStorage.getItem('should_scroll_to_status_position') === '1') {
                localStorage.removeItem('should_scroll_to_status_position');
                scroll_to_top(document.getElementById('submission-status').getBoundingClientRect().top + window.scrollY - 250);
            }
        }).catch(console.error)
    })

    async function init(submission_id = undefined) {

        let initialData = {}
        try {
            initialData = await _get_initial_data(submission_id);
        } catch (error) {
            initialData = {
                status: "error",
                error_message: error
            }
        }
        const template = await _get_template(initialData);
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
            init_submission_history(submissions, data.submission)
            _render_submission_date(data.submission.date * 1000)
            _init_show_results_btn_handler()
        } else if (status === "not_graded") {
            init_submission_history(submissions, data.submission)
            _render_submission_date(data.submission.date * 1000)
            _init_show_results_btn_handler()
            _init_cancel_submission_handler()
        } else if (status === "passed") {
            init_criteria_handlers();
            init_submission_history(submissions, data.submission)
            _render_submission_date(data.submission.date * 1000)
            _init_show_results_btn_handler()
        } else if (status === "did_not_pass") {
            init_submit_handlers();
            init_criteria_handlers();
            init_submission_history(submissions, data.submission)
            _render_submission_date(data.submission.date * 1000)
            _init_show_results_btn_handler()
        } else {
            // internal_server_error
            // do nothing
        }

        _toggle_loading_modal(false);
    }


    function init_submit_handlers() {
        _init_file_input_handlers();
        _init_term_inputs_hadnlers();

        $("#confirm-submit-btn", element).click(() => {
            submit();
        });

        $("#cancel-submit-btn", element).click(() => {
            _toggle_confirm_submit_modal(false);
        });

        $("#submit-form", element).submit((e) => {
            e.preventDefault();
            _toggle_confirm_submit_modal(true);
            scroll_to_top(document.getElementById('confirm-submit-prompt').getBoundingClientRect().top - element.getBoundingClientRect().top + window.scrollY);
        });
    }

    function _init_file_input_handlers() {
        $("#file-input").change(function (eventObject) {
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
            _toggle_file_error_msg(fileErrorMsg);
            _toggle_next_step_to_submit(fileErrorMsg === '');

            if (_is_valid_to_submit(element)) {
                $("#submit-btn", element).removeClass("lpx-btn-disabled");
            } else {
                $("#submit-btn", element).addClass("lpx-btn-disabled");
            }

            resize_unit();
        });

        $("#remove-file-btn", element).click(function () {

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
            _toggle_file_error_msg('');
            _toggle_submit_error('')

            // resize
            resize_unit();
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
    }

    function _init_term_inputs_hadnlers() {
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
        let allTermsAreChecked = true;

        $(".term-item input", element).each(function () {
            const isChecked = $(this).prop("checked");
            if (!isChecked) allTermsAreChecked = false;
        });

        if (!allTermsAreChecked) return false;

        const file = $("#file-input", element).prop("files")[0];
        if (!file) return false;

        if (_file_is_valid(file)) return false;

        return true;
    }

    function submit() {

        // _toggle_loading_modal(true);
        $("#confirm-submit-modal", element).addClass("d-none");
        _toggle_submit_error("")
        _upload_file()
            .then(file_uploaded => {
                _toggle_submit_error("");
                _submit_to_portal(file_uploaded.file_url).then(() => {
                    localStorage.setItem('should_scroll_to_status_position', '1')
                    _reload();

                }).catch(error => {
                    _toggle_loading_modal(false);
                    _toggle_submit_error(error);
                });
            })
            .catch(error => {
                // _toggle_loading_modal(false);
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

    function _submit_to_portal(download_url) {
        const submission_note = $("#submission-note", element).val();

        const basic_data = _get_basic_data(element);

        const requestData = {
            username: basic_data.username || 'edx',
            project_name: basic_data.assignment_name,
            email: basic_data.email,
            submission_url: download_url,
            submission_note: submission_note,
            course_code: basic_data.course_code,
        };

        return new Promise((res, rej) => {
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
        });
    }

    function _toggle_confirm_submit_modal(is_show) {
        if (is_show) {
            $("#confirm-submit-modal", element).removeClass("d-none");
        } else {
            $("#confirm-submit-modal", element).addClass("d-none");
        }

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

    function init_criteria_handlers() {
        const headers = Array.from(document.querySelectorAll('.criterion-header'));
        headers.forEach(header => {
            header.onclick = function () {
                const feedback = $(".criterion-feedback", header.parentElement);

                if (header.classList.contains("collapsed")) {
                    header.classList.remove("collapsed");
                    feedback.css("height", `${feedback.prop("scrollHeight")}px`);
                    resize_unit(feedback.prop("scrollHeight"), `${UNIT_HEIGHT_TRANSITION - 0.1}s`);
                } else {
                    header.classList.add("collapsed");
                    feedback.css("height", `0px`);
                    resize_unit(-feedback.prop("scrollHeight"), `${UNIT_HEIGHT_TRANSITION + 0.1}s`);
                }

            }
        })

    }

    function init_submission_history(submissions, current_submission) {
        if (submissions.length < 2) return;

        const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
        };


        const transformed_submissions = submissions.map(item => ({ date: new Date(item.create_date * 1000).toLocaleString(undefined, options), id: item.id }));

        transformed_submissions.reverse()


        const history_select = new SubmissionHistorySelect({
            OPTIONS: transformed_submissions,
            OPTION_HANDLER: function (item) {
                _toggle_loading_modal(true);
                init(item.id).catch(console.error).finally(() => {
                    scroll_to_top(-9000);
                    _toggle_loading_modal(false);
                    resize_unit();
                });
            },
            chosenValue: transformed_submissions.find(item => item.id == current_submission.id)
        });

        history_select.init();
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
        window.parent.postMessage({ type: 'learningprojectxblock', ...data }, "*")
    }

    function _render_submission_date(timestamp) {
        $('#submission-status-date span', element).text(new Date(timestamp).toLocaleString())
    }

    function _init_show_results_btn_handler() {
        $('#see-results-btn', element).click(function (event) {
            $('#submission-results', element).removeClass('d-none')
            $(this).addClass('d-none')
        })
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
                    console.log("canceled successfully")
                },
                error: function (xhr, status, error) {
                    console.error(xhr, status, error);
                    // if (xhr.responseJSON) {
                    //     if (typeof xhr.responseJSON.message === 'string') {
                    //         rej(xhr.responseJSON.message);
                    //     }

                    //     if (typeof xhr.responseJSON.error === 'string') {
                    //         rej(xhr.responseJSON.error);
                    //     }
                    // }
                    // rej("Internal Server Error");
                },
            });
        })
    }

}























