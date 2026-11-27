// ============================================================
// DRL Release — Home dashboard (Production / Test / All Users)
// Depends on common.js: getAppUrl, normalizeRow, showMessage,
// ShowDialog, JsonToDateTimeFormat, 'drl-version' ordering plug-in.
// NOTE: #btnAssign and dialog cancel/close are owned by
// AssignVersion.js — do NOT bind them here.
// ============================================================

// ------------------------------------------------------------
// Anchor-safe busy state. common.js setButtonLoading uses .text(),
// which would destroy the <img> inside these <a class="btn"> elements,
// so the label is swapped on a cloned node instead.
// ------------------------------------------------------------
function setAnchorBusy($btn, busy, busyText) {
    if (!$btn || !$btn.length) { return; }

    if (busy) {
        if ($btn.data('rl-busy') === true) { return; }
        $btn.data('rl-busy', true)
            .data('rl-html', $btn.html())
            .css({ 'pointer-events': 'none', 'opacity': '0.6' })
            .attr('aria-disabled', 'true');

        var $clone = $btn.clone();
        $clone.find('img').remove();
        var label = $.trim($clone.text());
        $btn.contents().filter(function () {
            return this.nodeType === 3 && $.trim(this.nodeValue).length > 0;
        }).last().each(function () {
            this.nodeValue = ' ' + (busyText || 'Working...');
        });
        $btn.data('rl-label', label);
    } else {
        var html = $btn.data('rl-html');
        if (html !== undefined) { $btn.html(html); }
        $btn.removeData('rl-busy').removeData('rl-html').removeData('rl-label')
            .css({ 'pointer-events': '', 'opacity': '' })
            .removeAttr('aria-disabled');
    }
}

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
                    { title: "USER ID", data: 'UserID', type: 'num' },
                    { title: "USER NAME", data: null, render: function (d, t, row) { return (row.FirstName || '') + ' ' + (row.LastName || ''); } },
                    // numeric-component ordering (1.9.44 < 1.9.101)
                    { title: "CURRENT VERSION", data: 'CurrentVersionName', type: 'drl-version' },
                    { title: "UPDATED", data: 'IsUpdated', render: function (d) { return d ? 'Yes' : 'No'; } },
                    // numeric-component ordering (1.9.44 < 1.9.101)
                    { title: "ASSIGN VERSION", data: 'AssignedVersionName', type: 'drl-version' },
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

// ============================================================
// GRID CSS HELPERS
// ============================================================
function ApplyCssOnList(versiontype) {
    var id = versiontype === "Test" ? "tableTestList"
        : (versiontype === "All" ? "tableAllList" : "tableProductionList");

    if ($("#" + id + " tbody tr").length === 0) { return; }

    $("#" + id + " thead tr").each(function () {
        // checkbox column is not a real sort target
        $(this).children('th').eq(0)
            .removeClass("sorting sorting_asc sorting_desc")
            .addClass("sorting_disabled");
        // user name reads left-aligned
        $(this).children('th').eq(2).addClass("td-username");
    });

    $("#" + id + " tbody tr").each(function () {
        $(this).children('td').eq(2).addClass("td-username");
    });
}

function tableIdForType(versionType) {
    return versionType === "Test" ? "#tableTestList"
        : (versionType === "All" ? "#tableAllList" : "#tableProductionList");
}

// ============================================================
// ASSIGN VERSION — open the popup for the checked rows
// (submit + close are handled by AssignVersion.js)
// ============================================================
function ShowAssignVersionPopup(versionType, done) {
    var tableId = tableIdForType(versionType);

    if (!$.fn.DataTable.isDataTable(tableId)) {
        showMessage("The list is still loading. Please try again.", true);
        if (done) { done(); }
        return;
    }

    var table = $(tableId).DataTable();
    var userIds = [], userNames = [], currentVersions = [], currentVersionIds = [];

    $(tableId + ' tbody tr').each(function () {
        var $row = $(this);
        if (!$row.find('input.row-checkbox').is(':checked')) { return; }

        var row = normalizeRow(table.row($row).data());
        if (!row) { return; }

        userIds.push(row.UserID);
        userNames.push($.trim((row.FirstName || '') + ' ' + (row.LastName || '')));
        currentVersions.push(row.CurrentVersionName || "0");
        currentVersionIds.push(row.CurrentVersion);
    });

    if (userIds.length === 0) {
        showMessage("Please select at least one user to assign a version.", true);
        if (done) { done(); }
        return;
    }

    $.ajax({
        type: "POST",
        url: getAppUrl("/Release/PopupAssignVersion"),
        traditional: true, // required for List<int> binding in ASP.NET Core
        data: {
            versionType: versionType,
            userIdList: userIds,
            userNameList: userNames,
            userCurrentVersions: currentVersions,
            currentVersionIdList: currentVersionIds
        },
        success: function (html) {
            $('#AssignVersion_dialog').html(html);
            ShowDialog(false, "AssignVersion_dialog");
            $(tableId + ' input.row-checkbox').prop('checked', false);
        },
        error: function () {
            showMessage("Error loading assign version dialog.", true);
        },
        complete: function () {
            if (done) { done(); }
        }
    });
}

// ============================================================
// EXPORT CSV — reads row OBJECTS by field name.
// The earlier version iterated rowData by numeric index, which
// produced a header-only file.
// ============================================================
function exportTableToCSV(tableId, filename) {
    if (!$.fn.DataTable.isDataTable(tableId)) {
        showMessage("The list is still loading. Please try again.", true);
        return;
    }

    var table = $(tableId).DataTable();
    var rows = table.rows({ search: 'applied', order: 'applied' }).data();

    if (!rows || rows.length === 0) {
        showMessage("No data to export.", true);
        return;
    }

    function cell(value) {
        if (value === null || value === undefined) { return '""'; }
        return '"' + String(value).replace(/"/g, '""') + '"';
    }

    var lines = [];
    lines.push([
        '"USER ID"', '"USER NAME"', '"CURRENT VERSION"', '"UPDATED"',
        '"ASSIGN VERSION"', '"IOS VERSION"', '"IPAD LOGIN"'
    ].join(','));

    rows.each(function (raw) {
        var row = normalizeRow(raw);
        var fullName = $.trim((row.FirstName || '') + ' ' + (row.LastName || ''));
        lines.push([
            cell(row.UserID),
            cell(fullName),
            cell(row.CurrentVersionName),
            cell(row.IsUpdated ? 'Yes' : 'No'),
            cell(row.AssignedVersionName),
            cell(row.IOSVersion),
            cell(JsonToDateTimeFormat(row.LastLoginDateTime))
        ].join(','));
    });

    // BOM + CRLF so Excel opens it with correct encoding and rows
    var payload = '\uFEFF' + lines.join('\r\n');
    var blob = new Blob([payload], { type: 'text/csv;charset=utf-8;' });

    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
        return;
    }

    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function exportFileName(prefix) {
    var d = new Date();
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var dd = ('0' + d.getDate()).slice(-2);
    return prefix + '_' + d.getFullYear() + '-' + mm + '-' + dd + '.csv';
}

// ============================================================
// DOCUMENT READY — bindings only.
// '.rlIndex' namespace + .off() makes re-binding idempotent.
// ============================================================
$(document).ready(function () {

    // ---- legacy tab switching ----
    $('.nav-tabs a').off('click.rlIndex').on('click.rlIndex', function (e) {
        e.preventDefault();
        var target = $(this).attr('href');
        var $pane = $('.tabs ' + target);
        if (!$pane.length) { return; }

        $pane.siblings('.tab-pane').stop(true, true).slideUp(300);
        $pane.stop(true, true).delay(300).slideDown(300, function () {
            // panes are hidden at init; re-measure once visible
            $pane.find('table.display').each(function () {
                if ($.fn.DataTable.isDataTable(this)) {
                    $(this).DataTable().columns.adjust();
                }
            });
        });

        $(this).parent('li').addClass('active').siblings().removeClass('active');
    });

    // ---- refresh ----
    $('#btnProductionRefresh').off('click.rlIndex').on('click.rlIndex', function (e) {
        e.preventDefault();
        var $b = $(this);
        setAnchorBusy($b, true, 'Refreshing...');
        RebindProductionVersionList();
        setAnchorBusy($b, false);
    });

    $('#btnTestRefresh').off('click.rlIndex').on('click.rlIndex', function (e) {
        e.preventDefault();
        var $b = $(this);
        setAnchorBusy($b, true, 'Refreshing...');
        RebindTestVersionList();
        setAnchorBusy($b, false);
    });

    $('#btnAllUserRefresh').off('click.rlIndex').on('click.rlIndex', function (e) {
        e.preventDefault();
        var $b = $(this);
        setAnchorBusy($b, true, 'Refreshing...');
        RebindAllVersionList();
        setAnchorBusy($b, false);
    });

    // ---- assign version (opens popup) ----
    $('#btnProductionAssignVersion').off('click.rlIndex').on('click.rlIndex', function (e) {
        e.preventDefault();
        var $b = $(this);
        setAnchorBusy($b, true, 'Loading...');
        ShowAssignVersionPopup("Production", function () { setAnchorBusy($b, false); });
    });

    $('#btnTestAssignVersion').off('click.rlIndex').on('click.rlIndex', function (e) {
        e.preventDefault();
        var $b = $(this);
        setAnchorBusy($b, true, 'Loading...');
        ShowAssignVersionPopup("Test", function () { setAnchorBusy($b, false); });
    });

    $('#btnAllUserAssignVersion').off('click.rlIndex').on('click.rlIndex', function (e) {
        e.preventDefault();
        var $b = $(this);
        setAnchorBusy($b, true, 'Loading...');
        ShowAssignVersionPopup("All", function () { setAnchorBusy($b, false); });
    });

    // ---- export csv ----
    $('#btnProductionExport').off('click.rlIndex').on('click.rlIndex', function (e) {
        e.preventDefault();
        exportTableToCSV('#tableProductionList', exportFileName('ProductionVersionUsers'));
    });

    $('#btnTestExport').off('click.rlIndex').on('click.rlIndex', function (e) {
        e.preventDefault();
        exportTableToCSV('#tableTestList', exportFileName('TestVersionUsers'));
    });

    $('#btnAllUserExport').off('click.rlIndex').on('click.rlIndex', function (e) {
        e.preventDefault();
        exportTableToCSV('#tableAllList', exportFileName('AllUsers'));
    });

    // ---- initial load ----
    RebindProductionVersionList();
    RebindTestVersionList();
    RebindAllVersionList();
});