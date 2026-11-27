// AppVersions page script
function BindList() {
    $.ajax({
        type: "POST",
        url: getAppUrl("/Release/VersionList"),
        data: {},
        async: false,
        success: function (data) {
            $('#tableVersionList').DataTable({
                destroy: true,
                data: data,
                autoWidth: false, // Stops DataTables guessing widths
                columnDefs: [
                    { width: "6%",  targets: 0 }, // ID
                    { width: "10%", targets: 1 }, // VERSION
                    { width: "40%", targets: 2 }, // DOWNLOADURL (longest)
                    { width: "12%", targets: 3 }, // IS PRODUCTION
                    { width: "10%", targets: 4 }, // ACTIVE
                    { width: "10%", targets: 5 }, // WHATS NEW
                    { width: "12%", targets: 6 }  // ACTION
                ],
                order: [[0, 'desc']], // 0 is the column index (ID), 'desc' is descending order
                columns: [
                    { title: "ID", data: 'AppVersionID' },
                    { title: "VERSION", data: 'Version' },
                    { title: "DOWNLOADURL", data: 'DownloadURL', orderable: false },
                    {
                        title: "IS PRODUCTION",
                        data: null,
                        render: function (data, type, row) {
                            return row.IsProduction ? '<span>Yes</span>' : '<span>No</span>';
                        }
                    },
                    {
                        title: "ACTIVE",
                        data: null,
                        render: function (data, type, row) {
                            return row.IsActive ? '<span>Yes</span>' : '<span>No</span>';
                        }
                    },
                    { title: "WHATS NEW", data: 'WhatsNew' },
                    {
                        title: "ACTION",
                        data: null,
                        render: function (data, type, row) {
                            if (row.IsActive) {
                                return '<a href="javascript:void(0)" onclick="updatestatus(' + row.AppVersionID + ',0,this)">InActive</a>';
                            } else {
                                return '<a href="javascript:void(0)" onclick="updatestatus(' + row.AppVersionID + ',1,this)">Active</a>';
                            }
                        }
                    }
                ]
            });
        }
    });
}

$(document).ready(function () {
    BindList();
});

function updatestatus(aapVersionId, status, el) {
    var $link = $(el);
    var originalText = $link.text();
    $link.text('Saving...').css('pointer-events', 'none').css('opacity', '0.6');

    $.ajax({
        type: "POST",
        url: getAppUrl("/Release/UpdateAppVersion"),
        traditional: true,
        data: { aapVersionId: aapVersionId, status: status },
        success: function (data) {
            // controller returns PascalCase (Success/Message) because PropertyNamingPolicy = null
            if (data && data.Success) {
                showMessage("Application Version has been updated.", false);
                BindList();
            } else {
                showMessage('Error: ' + (data ? data.Message : 'unknown'), true);
                $link.text(originalText).css('pointer-events', 'auto').css('opacity', '1');
            }
        },
        error: function () {
            showMessage("An error occurred while updating the status.", true);
            $link.text(originalText).css('pointer-events', 'auto').css('opacity', '1');
        }
    });
}

function applyalignment() {
    if ($("#tableVersionList tr").length > 0) {
        $("#tableVersionList thead tr").each(function () {
            $(this).children('th').eq(2).addClass("align_left");
            $(this).children('th').eq(5).addClass("align_left");
        });
        var rows = $("#tableVersionList").dataTable().fnGetNodes();
        $(rows).each(function () {
            $(this).children('td').eq(2).addClass("align_left");
            $(this).children('td').eq(5).addClass('align_left');
        });
    }
}
