$(document).ready(function () {
    // --- GLOBAL BUTTON LOADER HELPER ---
    function setButtonLoading($btn, isLoading, loadingText) {
        if (isLoading) {
            $btn.data('original-text', $btn.text()).prop('disabled', true).text(loadingText || 'Processing...');
        } else {
            $btn.prop('disabled', false).text($btn.data('original-text') || 'Submit');
        }
    }

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

    $("#btnProductionRefresh").click(function () { 
        var $btn = $(this);
        setButtonLoading($btn, true, 'Refreshing...');
        RebindProductionVersionList();
        setTimeout(function() { setButtonLoading($btn, false); }, 800); // Auto-reset after 800ms
    });
    $("#btnTestRefresh").click(function () { 
        var $btn = $(this);
        setButtonLoading($btn, true, 'Refreshing...');
        RebindTestVersionList();
        setTimeout(function() { setButtonLoading($btn, false); }, 800);
    });
    $("#btnAllUserRefresh").click(function () { 
        var $btn = $(this);
        setButtonLoading($btn, true, 'Refreshing...');
        RebindAllVersionList();
        setTimeout(function() { setButtonLoading($btn, false); }, 800);
    });

    // Assign Version Buttons (Open Popup)
    $("#btnProductionAssignVersion, #btnTestAssignVersion, #btnAllUserAssignVersion").click(function () {
        var $btn = $(this);
        setButtonLoading($btn, true, 'Loading...');
        
        var type = $(this).attr('id').replace('btn', '').replace('AssignVersion', ''); // "Production", "Test", or "AllUser"
        var popupType = type === "AllUser" ? "All" : type;
        
        ShowAssignVersionPopup(popupType, function() {
            setButtonLoading($btn, false); // Reset when popup opens
        });
    });
});

// === .NET 10 FIX: make row data work whether JSON is PascalCase or camelCase ===
function normalizeRow(r) {
    var out = {};
    for (var k in r) {
        out[k] = r[k];
        var pascal = k.charAt(0).toUpperCase() + k.slice(1);
        if (!(pascal in out)) out[pascal] = r[k];
        var camel = k.charAt(0).toLowerCase() + k.slice(1);
        if (!(camel in out)) out[camel] = r[k];
    }
    return out;
}

function ShowDialog(modal, popupid) {
    $("#overlay").show();
    $("#" + popupid).fadeIn(300);
    if (modal) { $("#overlay").unbind("click"); }
    else { $("#overlay").click(function () { HideDialog(popupid); }); }
}
function HideDialog(popupid) {
    $("#overlay").hide();
    $("#" + popupid).html('');
    $("#" + popupid).fadeOut(300);
}

function RebindProductionVersionList() { BindUserTable('#tableProductionList', '/Release/ProductionList', "Production"); }
function RebindTestVersionList() { BindUserTable('#tableTestList', '/Release/TestList', "Test"); }
function RebindAllVersionList() { BindUserTable('#tableAllList', '/Release/AllUserList', "All"); }

function BindUserTable(tableId, apiUrl, cssType) {
    $.ajax({
        type: "POST",
        url: apiUrl,
        data: {},
        async: false,
        success: function (data) {
            var rows = (data || []).map(normalizeRow);
            $(tableId).DataTable({
                destroy: true,
                data: rows,
                columns: [
                    { targets: 0, sortable: false, defaultContent: '<input type="checkbox" class="row-checkbox"/>' },
                    { title: "USER ID", data: 'UserID' },
                    { title: "USER NAME", data: null, render: function (d, t, row) { return (row.FirstName || '') + ' ' + (row.LastName || ''); } },
                    { title: "CURRENT VERSION", data: 'CurrentVersionName' },
                    { title: "UPDATED", data: 'IsUpdated', render: function (d) { return d ? 'Yes' : 'No'; } },
                    { title: "ASSIGN VERSION", data: 'AssignedVersionName' },
                    { title: "IOS VERSION", data: 'IOSVersion' },
                    { title: "", data: 'CurrentVersion', visible: false },
                    { title: "IPAD LOGIN", data: 'LastLoginDateTime', render: function (d) { return JsonToDateTimeFormat(d); } }
                ]
            });
            ApplyCssOnList(cssType);
        },
        error: function () { showMessage("Error loading " + cssType + " list.", true); }
    });
}

function JsonToDateTimeFormat(v) {
    if (!v) return "";
    var d = (typeof v === 'string' && v.indexOf('/Date(') === 0) ? new Date(parseInt(v.substr(6))) : new Date(v);
    if (isNaN(d.getTime())) return v;
    var m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    var mi = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
    return d.getDate() + "-" + m[d.getMonth()] + "-" + d.getFullYear() + " " + h + ":" + mi + " " + ap;
}

function ApplyCssOnList(versiontype) {
    var id = versiontype === "Test" ? "tableTestList" : (versiontype === "All" ? "tableAllList" : "tableProductionList");
    if ($("#" + id + " tbody tr").length > 0) {
        $("#" + id + " thead tr").each(function () {
            $(this).children('th').eq(0).removeClass("sorting_asc");
            $(this).children('th').eq(2).addClass("td-username");
        });
    }
}

function ShowAssignVersionPopup(versiontype, callback) {
    var UserIDS = [], UserNameS = [], UserCurrentVersionList = [], CurrentVersionIdList = [];
    var tableId = versiontype === "Test" ? "#tableTestList" : (versiontype === "All" ? "#tableAllList" : "#tableProductionList");
    var table = $(tableId).DataTable();

    $(tableId + ' tbody tr').each(function () {
        if ($(this).find('input[type="checkbox"]').is(':checked')) {
            var row = normalizeRow(table.row(this).data());
            UserIDS.push(row.UserID);
            UserNameS.push((row.FirstName || '') + ' ' + (row.LastName || ''));
            UserCurrentVersionList.push(row.CurrentVersionName || "0");
            CurrentVersionIdList.push(row.CurrentVersion);
            $(this).find('input[type="checkbox"]').prop('checked', false);
        }
    });

    $.ajax({
        type: "POST",
        url: "/Release/PopupAssignVersion",
        traditional: true,
        data: {
            versionType: versiontype,
            userIdList: UserIDS,
            userNameList: UserNameS,
            userCurrentVersions: UserCurrentVersionList,
            currentVersionIdList: CurrentVersionIdList
        },
        success: function (data) {
            $('#AssignVersion_dialog').html(data);
            ShowDialog(false, "AssignVersion_dialog");
            if (callback) callback(); // <-- ADD THIS LINE
        },
        error: function () { showMessage("Error loading assign version dialog.", true); }
    });
}

function showMessage(msg, isError) {
    $('#msgContainer').attr('class', isError ? 'error' : 'warning');
    $('#lblMessage').text(msg);
    $('#msgContainer').show();
}

// === SINGLE handlers (no duplicates) ===
$(document).on('click', '#btnassingdialogcancel, .dialog-close', function (e) {
    e.preventDefault();
    HideDialog("AssignVersion_dialog");
});

$(document).on('click', '#btnAssign', function (e) {
    e.preventDefault();
    var assignedVersionId = parseInt($("#ddlAssignVersion").val(), 10);
    var userIdsText = $("#hiddenUserIds").val();
    var userCurrentVersionId = parseInt($("#CurrentVersionId").val(), 10);

    if (!assignedVersionId) { showMessage("Please select a version to assign.", true); return; }
    if (!userIdsText) { showMessage("No users selected.", true); return; }

    var userIds = userIdsText.split(' / ').map(function (id) { return parseInt(id.trim(), 10); });

    $.ajax({
        type: "POST",
        url: "/Release/SaveAssignVersion",
        traditional: true,
        data: { assignedVersionId: assignedVersionId, userIdList: userIds, userCurrentVersionId: userCurrentVersionId },
        success: function (data) {
            if (data.success) {
                showMessage("Version has been assigned to selected users.", false);
                HideDialog("AssignVersion_dialog");
                RebindProductionVersionList();
                RebindTestVersionList();
                RebindAllVersionList();
            } else { showMessage('Error: ' + data.message, true); }
        },
        error: function () { showMessage("An error occurred while assigning the version.", true); }
    });
}

// --- Button Loading Helper Usage ---

// Assign Version Submit Handler (event delegation for dynamically loaded popup)
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

    var userIds = userIdsText.split(' / ').map(function (id) { return parseInt(id.trim(), 10); });

    setButtonLoading($btn, true, 'Assigning...');

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
                RebindProductionVersionList();
                RebindTestVersionList();
                RebindAllVersionList();
            } else {
                showMessage('Error: ' + data.message, true);
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

// Update Production Version Submit Handler (for Popup_UploadProductionVersion)
$(document).on('click', '#btnUpdateProduction', function (e) {
    e.preventDefault();
    var $btn = $('#btnUpdateProduction');
    var selectedVersion = $('input[name="appVersionId"]:checked').val();
    var whatsNewText = $('textarea[name="whatsNewList"]').val();
    var whatsNewArray = whatsNewText.split('\n').filter(line => line.trim() !== '');

    if (!selectedVersion) {
        showMessage("Please select a version to promote.", true);
        return;
    }

    setButtonLoading($btn, true, 'Updating...');

    $.ajax({
        url: '/Release/UpdateProductionVersion',
        type: 'POST',
        traditional: true,
        data: {
            appVersionId: selectedVersion,
            whatsNewList: whatsNewArray
        },
        success: function (response) {
            if (response.success) {
                showMessage("Application version promoted to production successfully.", false);
                HideDialog('UploadProductionVersion_dialog');
            } else {
                showMessage("Error: " + response.message, true);
            }
        },
        error: function () {
            showMessage("An error occurred while promoting the version.", true);
        },
        complete: function () {
            setButtonLoading($btn, false);
        }
    });
});

// Update Status Toggle Handler (for AppVersions.cshtml)
$(document).on('ajaxSuccess', 'form[action*="/Release/UpdateAppVersion"]', function () {
    // The revert logic is handled inside the updatestatus function itself
});

// Upload New App Form Submit Handler
$(document).on('submit', 'form[action*="/Release/UploadNewApp"]', function (e) {
    var $btn = $('#btnUploadApp');
    setButtonLoading($btn, true, 'Uploading...');
    // Form will submit normally; the page reload will handle the button state
    // We don't prevent submission; just set the loader state
});