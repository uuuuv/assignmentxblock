function AssignmentXBlock(runtime, element) {
    $(function ($) {

        const modal_content = $(element).parentsUntil('.modal-content').parent()
        modal_content.addClass('lpx-modal-content')

        const container = $(element).parentsUntil('.edit-xblock-modal').parent()
        const modal_actions = $('.modal-actions:not(.lpx_editor_buttons)', container.first())

        modal_actions.removeClass('modal-actions')
        modal_actions.remove()

        $('.lpx_save_button', element).click(function (eventObject) {
            eventObject.preventDefault();

            var html_content = tinymce.get("html_content").getContent();
            const max_file_size = $('#lpx-studio input[name=max-file-size]', element).val();
            const allowed_file_types = $('#lpx-studio input[name=allowed-file-types]', element).val();
            const score = $('#lpx-studio input[name=score]', element).val();

            if (!max_file_size || !allowed_file_types || !score) {
                alert("Missing input value")
                return
            }

            const data = {
                max_file_size,
                allowed_file_types,
                score,
                html_content
            }

            runtime.notify('save', {
                state: 'start',
                message: "Saving..."
            });

            $.ajax({
                url: runtime.handlerUrl(element, 'update_settings'),
                type: "POST",
                data: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
                success: function (response) {
                    runtime.notify('save', {
                        state: 'end',
                    });
                    window.location.reload(false)
                },
                error: function (xhr, status, error) {
                    console.error(xhr, status, error);
                },
            })
        })

        $('.lpx_cancel_button', element).click(() => {
            runtime.notify('cancel', {})
        })
    })
}