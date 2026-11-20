$(document).ready(function () {
    $('.nav-tabs a').on('click', function (e) {
        var currentAttrValue = jQuery(this).attr('href');
        $('.tabs ' + currentAttrValue).siblings().slideUp(500);
        $('.tabs ' + currentAttrValue).delay(500).slideDown(500);
        $(this).parent('li').addClass('active').siblings().removeClass('active');
        e.preventDefault();
    });
    RebindProductionVersionList();
    RebindTestVersionList();
    RebindAllVersionList();
    
    $("#btnProductionRefresh").click(function (e) { RebindProductionVersionList(); });
    $("#btnTestRefresh").click(function (e) { RebindTestVersionList(); });
    $("#btnAllUserRefresh").click(function (e) { RebindAllVersionList(); });

    $("#btnProductionAssignVersion").click(function (e) { ShowAssignVersionPopup("Production"); });
    $("#btnTestAssignVersion").click(function (e) { ShowAssignVersionPopup("Test"); });
    $("#btnAllUserAssignVersion").click(function (e) { ShowAssignVersionPopup("All"); });
});

function ShowDialog(modal, popupid) {
    $("#overlay").show();
    $("#" + popupid).fadeIn(300);
    if (modal) {
        $("#overlay").unbind("click");
    } else {
        $("#overlay").click(function (e) {
            HideDialog(popupid);
        });
    }
}

function HideDialog(popupid) {
    $("#overlay").hide();
    $("#" + popupid).html('');
    $("#" + popupid).fadeOut(300);
}

function RebindProductionVersionList() {
    $.ajax({
        type: "POST",
        url: "/Release/ProductionList", // <-- .NET 10 FIX: Removed _relativeBaseDirectory
        data: {},
        async: false,
        success: function (data) {
            $('#tableProductionList').DataTable({
                destroy: true,
                data: data,
                columns: [
                    { targets: 0, sortable: false, defaultContent: '<input type="checkbox" class="row-checkbox"/>' },
                    { title: "USER ID", data: 'UserID' },
                    { title: "USER NAME", data: null, render: function (data, type, row) { return (row.FirstName || '') + ' ' + (row.LastName || ''); } },
                    { title: "CURRENT VERSION", data: 'CurrentVersionName' },
                    { title: "UPDATED", data: 'IsUpdated', render: function (data) { return data ? 'Yes' : 'No'; } },
                    { title: "ASSIGN VERSION", data: 'AssignedVersionName' },
                    { title: "IOS VERSION", data: 'IOSVersion' },
                    { title: "", data: 'CurrentVersion', visible: false },
                    { title: "IPAD LOGIN", data: 'LastLoginDateTime', render: function (data) { return JsonToDateTimeFormat(data); } }
                ]
            });
            ApplyCssOnList("Production");
        }
    });
}

function RebindTestVersionList() {
    $.ajax({
        type: "POST",
        url: "/Release/TestList", // <-- .NET 10 FIX: Removed _relativeBaseDirectory
        data: {},
        async: false,
        success: function (data) {
            $('#tableTestList').DataTable({
                destroy: true,
                data: data,
                columns: [
                    { targets: 0, sortable: false, defaultContent: '<input type="checkbox" class="row-checkbox"/>' },
                    { title: "USER ID", data: 'UserID' },
                    { title: "USER NAME", data: null, render: function (data, type, row) { return (row.FirstName || '') + ' ' + (row.LastName || ''); } },
                    { title: "CURRENT VERSION", data: 'CurrentVersionName' },
                    { title: "UPDATED", data: 'IsUpdated', render: function (data) { return data ? 'Yes' : 'No'; } },
                    { title: "ASSIGN VERSION", data: 'AssignedVersionName' },
                    { title: "IOS VERSION", data: 'IOSVersion' },
                    { title: "", data: 'CurrentVersion', visible: false },
                    { title: "IPAD LOGIN", data: 'LastLoginDateTime', render: function (data) { return JsonToDateTimeFormat(data); } }
                ]
            });
            ApplyCssOnList("Test");
        }
    });
}

function RebindAllVersionList() {
    $.ajax({
        type: "POST",
        url: "/Release/AllUserList", // <-- .NET 10 FIX: Removed _relativeBaseDirectory
        data: {},
        async: false,
        success: function (data) {
            $('#tableAllList').DataTable({
                destroy: true,
                data: data,
                columns: [
                    { targets: 0, sortable: false, defaultContent: '<input type="checkbox" class="row-checkbox"/>' },
                    { title: "USER ID", data: 'UserID' },
                    { title: "USER NAME", data: null, render: function (data, type, row) { return (row.FirstName || '') + ' ' + (row.LastName || ''); } },
                    { title: "CURRENT VERSION", data: 'CurrentVersionName' },
                    { title: "UPDATED", data: 'IsUpdated', render: function (data) { return data ? 'Yes' : 'No'; } },
                    { title: "ASSIGN VERSION", data: 'AssignedVersionName' },
                    { title: "IOS VERSION", data: 'IOSVersion' },
                    { title: "", data: 'CurrentVersion', visible: false },
                    { title: "IPAD LOGIN", data: 'LastLoginDateTime', render: function (data) { return JsonToDateTimeFormat(data); } }
                ]
            });
            ApplyCssOnList("All");
        }
    });
}

function JsonToDateTimeFormat(dateAsFromServerSide) {
    if (!dateAsFromServerSide) return "";
    // ASP.NET Core sends ISO-8601 strings; legacy sent /Date(ms)/. This handles both perfectly.
    var parsedDate = (typeof dateAsFromServerSide === 'string' && dateAsFromServerSide.indexOf('/Date(') === 0)
        ? new Date(parseInt(dateAsFromServerSide.substr(6)))
        : new Date(dateAsFromServerSide);

    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var hours = parsedDate.getHours();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    var min = parsedDate.getMinutes() < 10 ? '0' + parsedDate.getMinutes() : parsedDate.getMinutes();

    return parsedDate.getDate() + "-" + monthNames[parsedDate.getMonth()] + "-" + parsedDate.getFullYear() + " " + hours + ":" + min + " " + ampm;
}

function ApplyCssOnList(versiontype) {
    var divversionid = versiontype === "Test" ? "tableTestList" : (versiontype === "All" ? "tableAllList" : "tableProductionList");
    if ($("#" + divversionid + " tr").length > 0) {
        $("#" + divversionid + " thead tr").each(function () {
            $(this).children('th').eq(0).removeClass("sorting_asc");
            $(this).children('th').eq(2).addClass("td-username");
            $(this).children('th').eq(7).addClass("td_currentversionid");
        });
        var rows = $("#" + divversionid).dataTable().fnGetNodes();
        $(rows).each(function () {
            $(this).children('td').eq(2).addClass("td-username");
            $(this).children('td').eq(7).addClass("td_currentversionid");
        });
    }
}

function ShowAssignVersionPopup(versiontype) {
    var UserIDS = [];
    var UserNameS = [];
    var UserCurrentVersionList = [];
    var CurrentVersionIdList = [];

    var tableId = versiontype === "Test" ? "#tableTestList"
                : (versiontype === "All" ? "#tableAllList" : "#tableProductionList");

    var table = $(tableId).DataTable();

    $(tableId + ' tbody tr').each(function () {
        if ($(this).find('input[type="checkbox"]').is(':checked')) {
            // Read straight from the row data (same values the old app intended)
            var row = table.row(this).data();

            UserIDS.push(row.UserID);
            UserNameS.push((row.FirstName || '') + ' ' + (row.LastName || ''));
            UserCurrentVersionList.push(row.CurrentVersionName || "0");
            CurrentVersionIdList.push(row.CurrentVersion); // <-- CORRECT ID, immune to column visibility

            $(this).find('input[type="checkbox"]').prop('checked', false);
        }
    });

    $.ajax({
        type: "POST",
        url: "/Release/PopupAssignVersion", // <-- .NET 10 FIX: Removed _relativeBaseDirectory
        traditional: true, // <-- .NET 10 FIX: CRITICAL for ASP.NET Core to bind List<int> correctly
        data: {
            versionType: versiontype,
            userIdList: UserIDS,
            userNameList: UserNameS,
            userCurrentVersions: UserCurrentVersionList,
            currentVersionIdList: CurrentVersionIdList
        },
        // <-- .NET 10 FIX: Removed JSON.stringify and contentType. ASP.NET Core expects form-encoded data for this signature.
        success: function (data) {
            $('#AssignVersion_dialog').html(data);
            ShowDialog(false, "AssignVersion_dialog");
        },
        error: function () {
            showMessage("Error loading assign version dialog.", true);
        }
    });
}

function showMessage(msg, isError) {
    if (isError) {
        $('#msgContainer').attr('class', 'error');
    } else {
        $('#msgContainer').attr('class', 'warning');
    }
    $('#lblMessage').text(msg);
    $('#msgContainer').show();
}

// --- Assign Version Dialog Handlers (matches old AssignVersion.js) ---

function CloseAssinedVersionWindow() {
    HideDialog("AssignVersion_dialog");
}

// Cancel button handler
$(document).on('click', '#btnassingdialogcancel, #btndialogClose', function (e) {
    CloseAssinedVersionWindow();
    e.preventDefault();
});

// Assign button handler
$(document).on('click', '#btnAssign', function (e) {
    e.preventDefault();

    var userids = $("#txtAV_UserID").text().split(' / ');
    var AssingedVersionId = parseInt($("#ddlAssignVersion option:selected").val());
    var UserCurrentVersionId = parseInt($("#CurrentVersionId").val());

    if (!AssingedVersionId) {
        showMessage("Please select a version to assign.", true);
        return;
    }

    $.ajax({
        type: "POST",
        url: "/Release/SaveAssignVersion",
        traditional: true,
        data: {
            assignedVersionId: AssingedVersionId,
            userIdList: userids,
            userCurrentVersionId: UserCurrentVersionId
        },
        success: function (data) {
            if (data.success) {
                showMessage("Version has been assigned to selected users.", false);
                CloseAssinedVersionWindow();
                // Refresh all tabs to show updated assignments
                RebindProductionVersionList();
                RebindTestVersionList();
                RebindAllVersionList();
            } else {
                showMessage('Error: ' + data.message, true);
            }
        },
        error: function () {
            showMessage("An error occurred while assigning the version.", true);
        }
    });
}

// --- Assign Version Dialog Handlers (matches old AssignVersion.js) ---

function SubmitAssignVersion() {
        var assignedVersionId = parseInt($("#ddlAssignVersion").val());
        var userIdsText = $("#hiddenUserIds").val();
        var userCurrentVersionId = parseInt($("#CurrentVersionId").val());

        if (!assignedVersionId) {
            showMessage("Please select a version to assign.", true);
            return;
        }

        if (!userIdsText) {
            showMessage("No users selected.", true);
            return;
        }
    

    // Split user IDs (they're stored as "7 / 14 / 22")
    var userIds = userIdsText.split(' / ').map(function(id) { return parseInt(id.trim()); });

    $.ajax({
        type: "POST",
        url: "/Release/SaveAssignVersion",
        traditional: true,
        data: {
            assignedVersionId: assignedVersionId,
            userIdList: userIds,
            userCurrentVersionId: userCurrentVersionId
        },
        success: function (data) {
            if (data.success) {
                showMessage("Version has been assigned to selected users.", false);
                HideDialog("AssignVersion_dialog");
                
                // Refresh all tabs to show updated assignments
                RebindProductionVersionList();
                RebindTestVersionList();
                RebindAllVersionList();
            } else {
                showMessage('Error: ' + data.message, true);
            }
        },
        error: function () {
            showMessage("An error occurred while assigning the version.", true);
        }
    });
}