// main js xblock
function AssignmentXBlock(runtime, element) {
    $(function ($) {
        /* Here's where you'd do things on page load. */
        $("#asx-settings-form", element).on('submit', function(eventObject) {
            eventObject.preventDefault();

            const max_file_size = $('#asx-settings-form input[name=max-file-size]', element).val();
            const allowed_file_types = $('#asx-settings-form input[name=allowed-file-types]', element).val();
            const score = $('#asx-settings-form input[name=score]', element).val();

            const data = {
                max_file_size,
                allowed_file_types,
                score
            }

            $.ajax({
                url: runtime.handlerUrl(element, 'update_settings'),
                type: "POST", 
                data: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
                success: function (response) {
                   console.log("success");
                },
                error: function (xhr, status, error) {
                    console.error(xhr, status, error);
                },
            })
        })
    })
}