$(document).ready(function () {
    // Initialize DataTable
    var table = $('#versionTable').DataTable({
        ajax: {
            url: '/AppVersion/GetVersionList',
            type: 'GET',
            dataSrc: '' // Because we return a flat array, not { data: [...] }
        },
        columns: [
            { data: 'Version' },
            { 
                data: 'IsProduction',
                render: function (data) {
                    return data ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-secondary">No</span>';
                }
            },
            { 
                data: 'CreatedDate',
                render: function (data) {
                    // .NET 10 returns ISO string. Format it cleanly.
                    if (!data) return '';
                    var date = new Date(data);
                    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                }
            },
            { 
                data: 'IsActive',
                render: function (data) {
                    return data ? '<span class="text-success">Active</span>' : '<span class="text-danger">Inactive</span>';
                }
            },
            {
                data: 'AppVersionID',
                render: function (data, type, row) {
                    // Toggle button: passes AppVersionID and the OPPOSITE of current IsActive status
                    var toggleStatus = row.IsActive ? 0 : 1;
                    var btnClass = row.IsActive ? 'btn-warning' : 'btn-success';
                    var btnText = row.IsActive ? 'Deactivate' : 'Activate';
                    
                    return `<button class="btn btn-sm ${btnClass} toggle-status" 
                            data-id="${data}" data-status="${toggleStatus}">${btnText}</button>`;
                }
            }
        ]
    });

    // Handle Toggle Status Click
    $('#versionTable tbody').on('click', '.toggle-status', function () {
        var appVersionId = $(this).data('id');
        var status = $(this).data('status');
        var btn = $(this);

        if (!confirm('Are you sure you want to change the status of this version?')) return;

        $.ajax({
            url: '/AppVersion/ToggleStatus',
            type: 'POST',
            data: { appVersionId: appVersionId, status: status },
            success: function (response) {
                if (response.success) {
                    table.ajax.reload(null, false); // Reload table without resetting pagination
                } else {
                    alert(response.message);
                }
            },
            error: function () {
                alert('An error occurred while updating the status.');
            }
        });
    });

    // Handle Filter Apply (Basic example, extend as needed to match old SP parameters)
    $('#applyFilter').on('click', function () {
        var isProduction = $('#filterIsProduction').val();
        
        // Update DataTables AJAX data to include filter
        table.settings()[0].ajax.data = function (d) {
            d.IsProduction = isProduction === "" ? null : (isProduction === "true");
        };
        
        table.ajax.reload();
        $('#filterModal').modal('hide');
    });
});