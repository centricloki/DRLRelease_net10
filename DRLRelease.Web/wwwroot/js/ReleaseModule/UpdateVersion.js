// wwwroot/js/ReleaseModule/UpdateVersion.js

$(document).ready(function () {

    // Enter key triggers Add
    $("#txtWhatsNew").on('keypress', function (event) {
        if (event.which === 13) { $("#btnAddNew").click(); }
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
    $(".radiobuttonlist li input").click(function () {
        $("#trwhatsnew").show();
        $("#lblVesion").html($(this).next().html().replace("V_", ""));
    });

    // Cancel / Back button
    $("#btnCancel").click(function () {
        window.location.href = $(this).data('url');
    });

    // Update button
    $("#btnUpdate").click(function () {
        var checked = $(".radiobuttonlist li input:checked");
        if (!checked.length) {
            showMessage("Please select a version.", true);
            return;
        }

        var strAppVersionId = checked.attr("id").replace("version", "");
        var strwhatsnewlist = [];
        if ($("#ullist li").length > 0) {
            $("#ullist li span").each(function () { strwhatsnewlist.push($(this).text()); });
        }

        $.ajax({
            type: "POST",
            url: _relativeBaseDirectory + "/Release/UpdateProductionVersion",
            data: JSON.stringify({ 'AppVersionId': strAppVersionId, 'WhatsNewList': strwhatsnewlist }),
            async: false,
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                if (data && data.success) {
                    showMessage("Production Version has been uploaded", false);
                    window.location.href = _relativeBaseDirectory + '/Release/Index';
                } else {
                    showMessage('Error: ' + (data ? data.message : 'unknown'), true);
                }
            },
            error: function () {
                showMessage("An unexpected error occurred.", true);
            }
        });
    });
});