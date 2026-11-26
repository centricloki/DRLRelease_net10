// wwwroot/js/ReleaseModule/UpdateVersion.js

$(document).ready(function () {

    // Local loader helper for this specific page
    function setLoading($btn, on, txt) {
        if (on) {
            $btn.data('orig', $btn.val()).prop('disabled', true).val(txt || 'Processing...');
        } else {
            $btn.prop('disabled', false).val($btn.data('orig') || 'Update');
        }
    }

    // Enter key triggers Add
    $("#txtWhatsNew").on('keypress', function (event) {
        if (event.which === 13) {
            event.preventDefault(); // Prevent form submission on Enter
            $("#btnAddNew").click();
        }
    });

    // Add note to list
    $("#btnAddNew").click(function () {
        var txt = $("#txtWhatsNew").val();
        if (txt) {
            var $li = $('<li>')
                .append($('<span>').text(txt))
                .append($('<a href="javascript:void(0);" class="remove-note">X</a>'));
            $("#ullist").append($li);
            $("#txtWhatsNew").val('').focus();
        }
    });

    // Remove note (event delegation for dynamic items)
    $(document).on('click', '.remove-note', function () {
        $(this).parent().remove();
    });

    // Show What's New block when radio is selected
    $('input[name="newversion"]').click(function () {
        $("#trwhatsnew").show();
        $("#lblVesion").html($(this).next().html().replace("V_", ""));
    });

    // Cancel / Back button
    $("#btnCancel").click(function () {
        window.location.href = $(this).data('url');
    });

    // Update button
    $("#btnUpdate").click(function () {
        var $btn = $(this);
        var checked = $('input[name="newversion"]:checked');

        if (!checked.length) {
            showMessage("Please select a version.", true);
            return;
        }

        var appVersionId = parseInt(checked.attr("id").replace("version", ""), 10);
        if (isNaN(appVersionId) || appVersionId <= 0) {
            showMessage("Invalid version selected.", true);
            return;
        }

        var strwhatsnewlist = [];
        if ($("#ullist li").length > 0) {
            $("#ullist li span").each(function () {
                strwhatsnewlist.push($(this).text());
            });
        }

        setLoading($btn, true, 'Updating...');

        $.ajax({
            type: "POST",
            url: getAppUrl("/Release/UpdateProductionVersion"),
            data: JSON.stringify({ AppVersionId: appVersionId, WhatsNewList: strwhatsnewlist }),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                if (data && data.success) {
                    showMessage("Production Version has been uploaded", false);
                    window.location.href = getAppUrl('/Release/Index');
                } else {
                    showMessage('Error: ' + (data ? data.message : 'unknown'), true);
                    setLoading($btn, false);
                }
            },
            error: function () {
                showMessage("An unexpected error occurred.", true);
                setLoading($btn, false);
            }
        });
    });
});
