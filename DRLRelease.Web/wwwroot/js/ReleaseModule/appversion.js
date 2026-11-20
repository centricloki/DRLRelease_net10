function BindList() {
    $.ajax({
        type: "POST",
        url: "/Release/VersionList",
        data: {},
        async: false,
        success: function (data) {
            $('#tableVersionList').DataTable({
                destroy: true,
                data: data,
                columns: [
                    { title: "ID", data: 'AppVersionID' },
                    { title: "VERSION", data: 'Version' },
                    { title: "DOWNLOADURL", data: 'DownloadURL' },
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
                            if (row.IsAction) {
                                if (row.IsActive) {
                                    return '<a href="javascript:updatestatus(' + row.AppVersionID + ',0)">InActive</a>';
                                } else {
                                    return '<a href="javascript:updatestatus(' + row.AppVersionID + ',1)">Active</a>';
                                }
                            } else {
                                return "";
                            }
                        }
                    }
                ]
            });
            applyalignment();
        }
    });
}

$(document).ready(function () {
    BindList();
});

function updatestatus(aapVersionId, status) {
    $.ajax({
        type: "POST",
        url: "/Release/UpdateAppVersion",
        datatype: 'json',
        data: JSON.stringify({ 'aapVersionId': aapVersionId, 'status': status }),
        async: false,
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            if (data.success) {
                showMessage("Application Version has been updated.", false);
                BindList();
            } else {
                showMessage('Error: ' + data.message, true);
            }
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
            $(this).children('td').eq(5).addClass("align_left");
        });
    }
}
