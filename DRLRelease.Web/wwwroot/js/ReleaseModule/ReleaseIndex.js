// ============================================================
// GLOBAL HELPERS (must be top-level, not inside document.ready)
// ============================================================
function setButtonLoading($btn, isLoading, loadingText) {
    if (isLoading) {
        $btn.data('original-text', $btn.text()).prop('disabled', true).text(loadingText || 'Processing...');
    } else {
        $btn.prop('disabled', false).text($btn.data('original-text') || 'Submit');
    }
}

function normalizeRow(r) {
    var out = {};
    if (!r) return out;
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

function showMessage(msg, isError) {
    $('#msgContainer').attr('class', isError ? 'error' : 'warning');
    $('#lblMessage').text(msg);
    $('#msgContainer').show();
}

function JsonToDateTimeFormat(v) {
    if (!v) return "";
    var d = (typeof v === 'string' && v.indexOf('/Date(') === 0) ? new Date(parseInt(v.substr(6))) : new Date(v);
    if (isNaN(d.getTime())) return v;
    var m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    var mi = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
    return d.getDate() + "-" + m[d.getMonth()] + "-" + d.getFullYear() + " " + h + ":" + mi + " " + ap;
}

// ============================================================
// GRID BINDING
// ============================================================
function RebindProductionVersionList() { BindUserTable('#tableProductionList', '/Release/ProductionList', "Production"); }
function RebindTestVersionList()       { BindUserTable('#tableTestList', '/Release/TestList', "Test"); }
function RebindAllVersionList()        { BindUserTable('#tableAllList', '/Release/AllUserList', "All"); }

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
                autoWidth: false, // <--- CRITICAL: Stops DataTables from guessing widths
                columnDefs: [
                    { width: "5%",  targets: 0, orderable: false }, // Checkbox
                    { width: "10%", targets: 1 }, // User ID
                    { width: "20%", targets: 2 }, // User Name
                    { width: "15%", targets: 3 }, // Current Version
                    { width: "10%", targets: 4 }, // Updated
                    { width: "15%", targets: 5 }, // Assign Version
                    { width: "10%", targets: 6 }, // IOS Version
                    { width: "0%",  targets: 7, visible: false },   // Hidden ID
                    { width: "15%", targets: 8 }  // IPad Login
                ],
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

function ApplyCssOnList(versiontype) {
    var id = versiontype === "Test" ? "tableTestList" : (versiontype === "All" ? "tableAllList" : "tableProductionList");
    if ($("#" + id + " tbody tr").length > 0) {
        $("#" + id + " thead tr").each(function () {
            $(this).children('th').eq(0).removeClass("sorting_asc");
            $(this).children('th').eq(2).addClass("td-username");
        });
    }
}

// ============================================================
// ASSIGN POPUP
// ============================================================
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
            if (callback) callback();
        },
        error: function () {
            showMessage("Error loading assign version dialog.", true);
            if (callback) callback(); // reset button even on error
        }
    });
}

// ============================================================
// DOCUMENT READY (bindings only — no function definitions here)
// ============================================================
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

    // Refresh buttons with loader
    $("#btnProductionRefresh").click(function () {
        var $btn = $(this);
        setButtonLoading($btn, true, 'Refreshing...');
        RebindProductionVersionList();
        setButtonLoading($btn, false);
    });
    $("#btnTestRefresh").click(function () {
        var $btn = $(this);
        setButtonLoading($btn, true, 'Refreshing...');
        RebindTestVersionList();
        setButtonLoading($btn, false);
    });
    $("#btnAllUserRefresh").click(function () {
        var $btn = $(this);
        setButtonLoading($btn, true, 'Refreshing...');
        RebindAllVersionList();
        setButtonLoading($btn, false);
    });

    // Export buttons
    $("#btnProductionExport").click(function () {
        exportTableToCSV('#tableProductionList', 'ProductionVersionUsers_' + new Date().toISOString().slice(0,10) + '.csv');
    });
    $("#btnTestExport").click(function () {
        exportTableToCSV('#tableTestList', 'TestVersionUsers_' + new Date().toISOString().slice(0,10) + '.csv');
    });
    $("#btnAllUserExport").click(function () {
        exportTableToCSV('#tableAllList', 'AllUsers_' + new Date().toISOString().slice(0,10) + '.csv');
    });

    // Assign popup openers with loader
    $("#btnProductionAssignVersion").click(function () {
        var $btn = $(this);
        setButtonLoading($btn, true, 'Loading...');
        ShowAssignVersionPopup("Production", function () { setButtonLoading($btn, false); });
    });
    $("#btnTestAssignVersion").click(function () {
        var $btn = $(this);
        setButtonLoading($btn, true, 'Loading...');
        ShowAssignVersionPopup("Test", function () { setButtonLoading($btn, false); });
    });
    $("#btnAllUserAssignVersion").click(function () {
        var $btn = $(this);
        setButtonLoading($btn, true, 'Loading...');
        ShowAssignVersionPopup("All", function () { setButtonLoading($btn, false); });
    });
});

// ============================================================
// DELEGATED HANDLERS (single, no duplicates)
// ============================================================
$(document).on('click', '#btnassingdialogcancel, .dialog-close', function (e) {
    e.preventDefault();
    HideDialog("AssignVersion_dialog");
});

// Assign submit (ONE handler only)
$(document).on('click', '#btnAssign', function (e) {
    e.preventDefault();
    var $btn = $(this);
    var assignedVersionId = parseInt($("#ddlAssignVersion").val(), 10);
    var userIdsText = $("#hiddenUserIds").val();
    var userCurrentVersionId = parseInt($("#CurrentVersionId").val(), 10);

    if (!assignedVersionId) { showMessage("Please select a version to assign.", true); return; }
    if (!userIdsText) { showMessage("No users selected.", true); return; }

    var userIds = userIdsText.split(' / ').map(function (id) { return parseInt(id.trim(), 10); });

    setButtonLoading($btn, true, 'Assigning...');

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
            } else {
                showMessage('Error: ' + data.message, true);
            }
        },
        error: function () { showMessage("An error occurred while assigning the version.", true); },
        complete: function () { setButtonLoading($btn, false); }
    });
});

// Promote to production (ONE handler — view must NOT have inline onclick)
$(document).on('click', '#btnUpdateProduction', function (e) {
    e.preventDefault();
    var $btn = $(this);
    var selectedVersion = $('input[name="appVersionId"]:checked').val();
    var whatsNewText = $('textarea[name="whatsNewList"]').val() || '';
    var whatsNewArray = whatsNewText.split('\n').filter(function (line) { return line.trim() !== ''; });

    if (!selectedVersion) { showMessage("Please select a version to promote.", true); return; }

    setButtonLoading($btn, true, 'Updating...');

    $.ajax({
        url: '/Release/UpdateProductionVersion',
        type: 'POST',
        traditional: true,
        data: { appVersionId: selectedVersion, whatsNewList: whatsNewArray },
        success: function (response) {
            if (response.success) {
                showMessage("Application version promoted to production successfully.", false);
                HideDialog('UploadProductionVersion_dialog');
                RebindProductionVersionList();
                RebindTestVersionList();
                RebindAllVersionList();
            } else {
                showMessage("Error: " + response.message, true);
            }
        },
        error: function () { showMessage("An error occurred while promoting the version.", true); },
        complete: function () { setButtonLoading($btn, false); }
    });
});

// Upload New App form (full-page post; button stays disabled until reload)
$(document).on('submit', 'form[action*="/Release/UploadNewApp"]', function () {
    var $btn = $('#btnUploadApp');
    if ($btn.length) {
        $btn.prop('disabled', true).text('Uploading...');
    }
});

// ============================================================
// EXPORT TABLE TO CSV
// ============================================================
function exportTableToCSV(tableId, filename) {
    var table = $(tableId).DataTable();
    var rows = table.rows({ search: 'applied' }).data();
    
    if (rows.length === 0) {
        showMessage("No data to export.", true);
        return;
    }

    var csv = [];
    
    // Headers (skip checkbox column)
    csv.push('"USER ID","USER NAME","CURRENT VERSION","UPDATED","ASSIGN VERSION","IOS VERSION","IPAD LOGIN"');

    // Extract data from each row
    rows.each(function(rowData) {
        // rowData is an object with properties like UserID, FirstName, LastName, etc.
        var userId = rowData.UserID || '';
        var userName = (rowData.FirstName || '') + ' ' + (rowData.LastName || '');
        var currentVersion = rowData.CurrentVersionName || '';
        var updated = rowData.IsUpdated ? 'Yes' : 'No';
        var assignVersion = rowData.AssignedVersionName || '';
        var iosVersion = rowData.IOSVersion || '';
        
        // Format date
        var lastLogin = '';
        if (rowData.LastLoginDateTime) {
            var d = new Date(rowData.LastLoginDateTime);
            if (!isNaN(d.getTime())) {
                var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                var h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM';
                h = h % 12 || 12;
                var mi = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
                lastLogin = d.getDate() + "-" + monthNames[d.getMonth()] + "-" + d.getFullYear() + " " + h + ":" + mi + " " + ap;
            }
        }
        
        csv.push('"' + userId + '","' + userName + '","' + currentVersion + '","' + updated + '","' + assignVersion + '","' + iosVersion + '","' + lastLogin + '"');
    });

    // Create and download CSV
    var csvContent = csv.join('\n');
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}