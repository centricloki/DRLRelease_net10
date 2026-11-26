// ============================================================
// GRID BINDING
// ============================================================
function RebindProductionVersionList() { BindUserTable('#tableProductionList', getAppUrl('/Release/ProductionList'), "Production"); }
function RebindTestVersionList() { BindUserTable('#tableTestList', getAppUrl('/Release/TestList'), "Test"); }
function RebindAllVersionList() { BindUserTable('#tableAllList', getAppUrl('/Release/AllUserList'), "All"); }

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
                autoWidth: false, // Stops DataTables from guessing widths
                columnDefs: [
                    { width: "5%", targets: 0, orderable: false }, // Checkbox
                    { width: "10%", targets: 1 }, // User ID
                    { width: "20%", targets: 2 }, // User Name
                    { width: "15%", targets: 3 }, // Current Version
                    { width: "10%", targets: 4 }, // Updated
                    { width: "15%", targets: 5 }, // Assign Version
                    { width: "10%", targets: 6 }, // IOS Version
                    { width: "0%", targets: 7, visible: false },   // Hidden ID
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
// ASSIGN POPUP OPENER
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
        url: getAppUrl("/Release/PopupAssignVersion"),
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
// DOCUMENT READY (bindings only)
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
        exportTableToCSV('#tableProductionList', 'ProductionVersionUsers_' + new Date().toISOString().slice(0, 10) + '.csv');
    });
    $("#btnTestExport").click(function () {
        exportTableToCSV('#tableTestList', 'TestVersionUsers_' + new Date().toISOString().slice(0, 10) + '.csv');
    });
    $("#btnAllUserExport").click(function () {
        exportTableToCSV('#tableAllList', 'AllUsers_' + new Date().toISOString().slice(0, 10) + '.csv');
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
    rows.each(function (rowData) {
        var userId = rowData.UserID || '';
        var userName = (rowData.FirstName || '') + ' ' + (rowData.LastName || '');
        var currentVersion = rowData.CurrentVersionName || '';
        var updated = rowData.IsUpdated ? 'Yes' : 'No';
        var assignVersion = rowData.AssignedVersionName || '';
        var iosVersion = rowData.IOSVersion || '';

        var lastLogin = '';
        if (rowData.LastLoginDateTime) {
            var d = new Date(rowData.LastLoginDateTime);
            if (!isNaN(d.getTime())) {
                var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
