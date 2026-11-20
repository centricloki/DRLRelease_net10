
//$('#AssignVersion_dialog .web_dialog_header').mousedown(handle_mousedown);

function CloseAssinedVersionWindow() {
    HideDialog("AssignVersion_dialog");
}
$("#btnassingdialogcancel").click(function (e) {
    CloseAssinedVersionWindow();
});
$("#btndialogClose").click(function (e) {
    CloseAssinedVersionWindow();
});
$("#btnAssign").click(function (e) {
    var userids = $("#txtAV_UserID").text().split(' / ');
    var AssingedVersion = $("#ddlAssignVersion option:selected").text();
    var AssingedVersionId = parseInt($("#ddlAssignVersion option:selected").val());

    var UserIDS = [];
    UserIDS = userids;

    $.ajax({
        type: "POST",
        url: _relativeBaseDirectory + "/Release/SaveAssignVersion",
        datatype: 'json',
        data: JSON.stringify({ 'AssingedVersionId': AssingedVersionId, 'UserIdList': UserIDS, 'UserCurrentVersionId': parseInt($("#CurrentVersionId").val()) }),
        async: false,
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            if (data.Success) {
                showMessage("Version has been assigned to selected users.", false);
                RebindAllTabs();                       // refresh Production + Test + All
                CloseAssinedVersionWindow();
            }
            else {
                showMessage('Error: ' + data.Message, true);
            }
        }
    });

});