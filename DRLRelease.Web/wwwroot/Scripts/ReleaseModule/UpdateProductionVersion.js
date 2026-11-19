
function clicka(aid) {
    $(aid).parent().remove();
}
//$('#UploadProductionVersion_dialog .web_dialog_header').mousedown(handle_mousedown);
$("#txtWhatsNew").on('keypress', function (event) {
    if (event.which === 13) {
        $("#btnAddNew").click();
    }
});
$("#btnAddNew").click(function (e) {
    var txtWhatsNew = $("#txtWhatsNew").val();
    if (txtWhatsNew != null && txtWhatsNew != undefined && txtWhatsNew != "") {
        var htmlli = "<li><span>" + txtWhatsNew + "</span><a href='javascript:void(0);' onclick='clicka(this);' style='padding-left:5px;'>X</a></li>";
        $("#ullist").append(htmlli);
        $("#txtWhatsNew").val('');
        $("#txtWhatsNew").focus();
    }
});

$("#btnUpdate").click(function (e) {

    if ($(".radiobuttonlist li input:checked")) {
        var strAppVersionId = $(".radiobuttonlist li input:checked").attr("id").replace("version", "");
        var strwhatsnewlist = [];
        if ($("#ullist li").length > 0) {
            $("#ullist li span").each(function () {
                strwhatsnewlist.push($(this).text());
            })
        }
        $.ajax({
            type: "POST",
            url: _relativeBaseDirectory + "/Release/UpdateProductionVersion",
            datatype: 'json',
            data: JSON.stringify({ 'AppVersionId': strAppVersionId, 'WhatsNewList': strwhatsnewlist }),
            async: false,
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                if (data != null) {
                    if (data.success) {
                        showMessage("Production Version has been uploaded", false);
                        $("#btnUPVdialogcancel").click();
                        HideDialog("UploadProductionVersion_dialog");
                        //location.reload();
                    }
                    else {
                        showMessage('Error: ' + data.message, true);
                        HideDialog("UploadProductionVersion_dialog");
                    }
                }
            }
        });

    }
});

$("#btndialogClose").click(function (e) {
    HideDialog("UploadProductionVersion_dialog");
    e.preventDefault();
});

$("#btnUPVdialogcancel").click(function (e) {
    HideDialog("UploadProductionVersion_dialog");
    e.preventDefault();
});

$(".radiobuttonlist li input").click(function () {
    $("#trwhatsnew").show();
    $("#lblVesion").html($(this).next().html().replace("V_", ""));
});
