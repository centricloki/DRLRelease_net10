// Assign Version modal popup handlers
$(document).on('click', '#btnassingdialogcancel, .dialog-close', function (e) {
    e.preventDefault();
    HideDialog("AssignVersion_dialog");
});

$(document).on('click', '#btnAssign', function (e) {
    e.preventDefault();
    var $btn = $(this);
    var assignedVersionId = parseInt($("#ddlAssignVersion").val(), 10);
    var userIdsText = $("#hiddenUserIds").val();
    var userCurrentVersionId = parseInt($("#CurrentVersionId").val(), 10);

    if (!assignedVersionId) {
        showMessage("Please select a version to assign.", true);
        return;
    }
    if (!userIdsText) {
        showMessage("No users selected.", true);
        return;
    }

    var userIds = userIdsText.split(' / ').map(function (id) {
        return parseInt(id.trim(), 10);
    });

    setButtonLoading($btn, true, 'Assigning...');

    $.ajax({
        type: "POST",
        url: getAppUrl("/Release/SaveAssignVersion"),
        traditional: true,
        data: {
            assignedVersionId: assignedVersionId,
            userIdList: userIds,
            userCurrentVersionId: userCurrentVersionId
        },
        success: function (data) {
            if (data && data.success) {
                showMessage("Version has been assigned to selected users.", false);
                HideDialog("AssignVersion_dialog");
                RebindProductionVersionList();
                RebindTestVersionList();
                RebindAllVersionList();
            } else {
                showMessage('Error: ' + (data ? data.message : 'unknown'), true);
            }
        },
        error: function () {
            showMessage("An error occurred while assigning the version.", true);
        },
        complete: function () {
            setButtonLoading($btn, false);
        }
    });
});
