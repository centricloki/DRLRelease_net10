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
            var htmlli = "<li><span>" + txt + "</span><a href='javascript:void(0);' class='remove-note' style='padding-left:5px;'>X</a></li>";
            $("#ullist").append(htmlli);
            $("#txtWhatsNew").val('').focus();
        }
    });

    // Remove note (event delegation for dynamic items)
    $(document).on('click', '.remove-note', function () {
        $(this).parent().remove();
    });

    // Show What's New block when radio is selected 
    // FIX: Changed selector to match the actual name attribute in UpdateVersion.cshtml
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

        // FIX: Changed selector to match the actual name attribute
        var checked = $('input[name="newversion"]:checked');

        if (!checked.length) {
            showMessage("Please select a version.", true);
            return;
        }

        var strAppVersionId = checked.attr("id").replace("version", "");
        var strwhatsnewlist = [];
        if ($("#ullist li").length > 0) {
            $("#ullist li span").each(function () {
                strwhatsnewlist.push($(this).text());
            });
        }

        // Apply loader before AJAX call
        setLoading($btn, true, 'Updating...');

        $.ajax({
            type: "POST",
            // FIX: Removed undefined _relativeBaseDirectory
            url: "/Release/UpdateProductionVersion",
            data: JSON.stringify({ 'AppVersionId': strAppVersionId, 'WhatsNewList': strwhatsnewlist }),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                if (data && data.success) {
                    showMessage("Production Version has been uploaded", false);
                    // FIX: Removed undefined _relativeBaseDirectory
                    window.location.href = '/Release/Index';
                } else {
                    showMessage('Error: ' + (data ? data.message : 'unknown'), true);
                    setLoading($btn, false); // Reset button on error
                }
            },
            error: function () {
                showMessage("An unexpected error occurred.", true);
                setLoading($btn, false); // Reset button on error
            }
        });
    });
});