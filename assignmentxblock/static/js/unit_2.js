
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
            this.is_rendering = false
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
            if (this.is_rendering) return;

            this.is_rendering = true
            const existingOptionsContainer = this.getEleById(this.OPTIONS_CONTAINER_ID);
            if (existingOptionsContainer) {
                existingOptionsContainer.remove()
            }

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

            container.style.animation = 'history_animation_open .4s'

            container.appendChild(ul);

            this.getEleById(this.MAIN_ID).appendChild(container);
            // this.getEleById(this.MAIN_ID).appendChild(ul);
            resize_unit(container.scrollHeight, '.2s')
            this.is_rendering = false
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
            if (this.is_rendering) return;

            this.is_rendering = true
            const optionsContainer = this.getEleById(this.OPTIONS_CONTAINER_ID);
            if (optionsContainer) {
                // const containerHeight = document.getElementById(this.MAIN_ID).offsetHeight;
                // document.getElementById(this.MAIN_ID).style.height = `${containerHeight - optionsContainer.offsetHeight}px`

                // resize_unit(0, ".2s")
                resize_unit(-optionsContainer.scrollHeight + 2, '.4s')
                optionsContainer.style.overflow = 'hidden'
                optionsContainer.style.animation = 'history_animation_close .2s forwards'
                setTimeout(() => {
                    optionsContainer.remove();
                    this.is_rendering = false
                }, 200);
            } else {
                this.is_rendering = false
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
        window.addEventListener('message', (event) => {
            const data = event.data

            if (data.type === "learningprojectxblock") {
                if (data.reload) {
                    init().then().catch(console.error)
                }

                if (data.resize) {
                    resize_unit()
                }
            }
        });

        init().catch(console.error)
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
        } else if (status === "unable_to_review") {
            init_submission_history(submissions, data.submission)
            _render_submission_date(data.submission.date * 1000)
        } else if (status === "not_graded") {
            init_submission_history(submissions, data.submission)
            _render_submission_date(data.submission.date * 1000)
        } else if (status === "passed") {
            init_criteria_handlers();
            init_submission_history(submissions, data.submission)
            _render_submission_date(data.submission.date * 1000)
        } else if (status === "did_not_pass") {
            init_criteria_handlers();
            init_submission_history(submissions, data.submission)
            _render_submission_date(data.submission.date * 1000)
        } else {
            // internal_server_error
            // do nothing
        }

        _toggle_loading_modal(false);
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

        const language = $.cookie('openedx-language-preference') || 'vi'
        const transformed_submissions = submissions.map(item => ({ date: new Date(item.create_date * 1000).toLocaleString(language, options), id: item.id }));

        transformed_submissions.reverse()


        const history_select = new SubmissionHistorySelect({
            OPTIONS: transformed_submissions,
            OPTION_HANDLER: function (item) {
                _toggle_loading_modal(true);
                init(item.id).catch(console.error).finally(() => {
                    resize_unit();
                    scroll_to_top(-9000);
                    _toggle_loading_modal(false);
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
                iframeHeight: document.getElementById('content').scrollHeight + offset,
                transition: transition
            }
        })
    }


    function _post_message(data) {
        window.parent.postMessage({ type: 'learningprojectxblock', unit_usage_id: $('#portal-data', element).data('unit-usage-id'), ...data }, "*")
    }

    function _render_submission_date(timestamp) {
        const language = $.cookie('openedx-language-preference') || 'vi'
        $('#submission-status-date span', element).text(new Date(timestamp).toLocaleString(language, {
            year: "numeric",
            month: "long",
            day: "numeric",
        }))
    }
}























