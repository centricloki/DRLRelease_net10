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
    $("#btnProductionRefresh").click(function (e) {
        RebindProductionVersionList();
    });
    $("#btnTestRefresh").click(function (e) {
        RebindTestVersionList();
    });
    $("#btnAllUserRefresh").click(function (e) {
        RebindAllVersionList();
    });

    $("#btnProductionFilter").click(function (e) {
        ShowFilterPopup("Production");
    });
    $("#btnTestFilter").click(function (e) {
        ShowFilterPopup("Test");
    });

    $("#btnProductionAssignVersion").click(function (e) {
        ShowAssignVersionPopup("Production");
    });
    $("#btnTestAssignVersion").click(function (e) {
        ShowAssignVersionPopup("Test");
    });
    $("#btnAllUserAssignVersion").click(function (e) {
        ShowAssignVersionPopup("All");
    });
    $("#btnUploadProductVersion").click(function (e) {
        $.ajax({
            type: "POST",
            url: _relativeBaseDirectory + "/Release/PopupUploadProductionVersion",
            data: {},
            success: function (data) {
                $('#UploadProductionVersion_dialog').html(data);
                ShowDialog(false, "UploadProductionVersion_dialog");
                e.preventDefault();
            }
        });
    });

    //$("#btnUploadApp").click(function (e) {
    //    $.ajax({
    //        type: "GET",
    //        url: _relativeBaseDirectory + "/Release/PopupUploadNewApp",
    //        data: {},
    //        success: function (data) {
    //            $('#UploadNewApp_dialog').html(data);
    //            ShowDialog(false, "UploadNewApp_dialog");
    //            e.preventDefault();
    //        }
    //    });
    //});

    //$('#tableProductionList tbody').on('click', 'tr', function () {
    //    if ($(this).children('td').find("input").is(":checked")) {
    //        $(this).children('td').find("input").removeAttr("checked", "checked");
    //        $(this).removeClass('selected');
    //    }
    //    else {
    //        $(this).children('td').find("input").attr("checked", "checked")
    //        $(this).addClass('selected');
    //        //$(this).toggleClass('selected');
    //    }
    //});

    //$('#tableTestList tbody').on('click', 'tr', function () {
    //    if ($(this).children('td').find("input").is(":checked")) {
    //        $(this).children('td').find("input").removeAttr("checked", "checked");
    //        $(this).removeClass('selected');
    //    }
    //    else {
    //        $(this).children('td').find("input").attr("checked", "checked")
    //        $(this).addClass('selected');
    //        //$(this).toggleClass('selected');
    //    }
    //});
});

function selectedRepIds(chkid) {
    if ($(chkid).is(":checked")) {
        $(chkid).parent().addClass("selected");
    }
    else {
        $(chkid).parent().removeClass("selected");
    }
}
// This function is using show the dialog/popup
function ShowDialog(modal, popupid) {
    $("#overlay").show();
    $("#" + popupid).fadeIn(300);
    if (modal) {
        $("#overlay").unbind("click");
    }
    else {
        $("#overlay").click(function (e) {
            HideDialog(popupid);
        });
    }
}
// The function is hide the dialog box / popup
function HideDialog(popupid) {
    $("#overlay").hide();
    $("#" + popupid).html('');
    $("#" + popupid).fadeOut(300);
}
// This function used to drag and drop function for the popup
function handle_mousedown(e) {

    window.my_dragging = {};
    my_dragging.pageX0 = e.pageX;
    my_dragging.pageY0 = e.pageY;
    my_dragging.elem = $(this).parent();
    my_dragging.offset0 = $(this).offset();
    function handle_dragging(e) {
        var left = my_dragging.offset0.left + (e.pageX - my_dragging.pageX0);
        var top = my_dragging.offset0.top + (e.pageY - my_dragging.pageY0);
        $(my_dragging.elem)
        .offset({ top: top, left: left });
    }
    function handle_mouseup(e) {
        $(this).parent()
    .off('mousemove', handle_dragging)
    .off('mouseup', handle_mouseup);
    }

    $(this).parent()
    .on('mouseup', handle_mouseup)
    .on('mousemove', handle_dragging);
}
// This function is bind user app version list which is used Production Version
function RebindProductionVersionList() {
    //$.ajax({
    //    type: "POST",
    //    url: _relativeBaseDirectory + "/Release/ProductionVersionList",
    //    data: {},
    //    success: function (data) {
    //        $('#divProductionVersion').html(data);
    //    }
    //});
    $.ajax({
        type: "POST",
        url: _relativeBaseDirectory + "/Release/ProductionList",
        data: {},
        async: false,
        success: function (data) {
            var dataSet = [];
            dataSet = data;
            $('#tableProductionList').DataTable({
                destroy: true,
                data: dataSet,
                columns: [
                       {
                           targets: 0,
                           sortable: false,
                           defaultContent: '',
                           //orderable: false,
                           "render": function (data, type, full, meta) {
                               //return '<span class="custom-checkbox"><input type="checkbox" value="wibble" onchange="selectedRepIds(this);"></span>';
                               return '<input type="checkbox" value="wibble"/>';
                           }
                       },
                       { title: "USER ID", data: 'UserID' },
                       {
                           title: "USER NAME",
                           data: null,
                           sclass: "amit",
                           render: function (data, type, row) {
                               // Combine the first and last names into a single table field
                               $(row).addClass('important');
                               return data.FirstName + ' ' + data.LastName;
                           },
                           editField: ['FirstName', 'LastName']
                       },

                    { title: "CURRENT VERSION", data: 'CurrentVersionName' },
                    {
                        title: "UPDATED",
                        data: null,
                        render: function (data, type, row) {
                            // Combine the first and last names into a single table field
                            if (data.IsUpdated) {
                                return '<span>Yes</span>';
                            }
                            else {
                                return '<span>No</span>';
                            }
                        },
                    },
                    { title: "ASSIGN VERSION", data: 'AssignedVersionName' },
                    //AssignedVersionName
                    { title: "IOS VERSION", data: 'IOSVersion' },
                    { title: "", data: 'CurrentVersion' },
                    {
                        title: "IPAD LOGIN",
                        data: null,
                        render: function (data, type, row) {
                            return '<span>' + JsonToDateTimeFormat(data.LastLoginDateTime) + '</span>';
                        },
                    }
                ]
            });
        }
    });
    ApplyCssOnList("Production");
}
// This function is bind user app version list which is used Test Version
function RebindTestVersionList() {
    $.ajax({
        type: "POST",
        url: _relativeBaseDirectory + "/Release/TestList",
        data: {},
        async: false,
        success: function (data) {
            var dataSet = [];
            dataSet = data;
            $('#tableTestList').DataTable({
                destroy: true,
                data: dataSet,
                columns: [
                       {
                           targets: 0,
                           sortable: false,
                           defaultContent: '',
                           //orderable: false,
                           "render": function (data, type, full, meta) {
                               return '<input type="checkbox" value="wibble">';
                           }
                       },
                       { title: "USER ID", data: 'UserID' },
                       {
                           title: "USER NAME",
                           data: null,
                           sclass: "amit",
                           render: function (data, type, row) {
                               // Combine the first and last names into a single table field
                               $(row).addClass('important');
                               return data.FirstName + ' ' + data.LastName;
                           },
                           editField: ['FirstName', 'LastName']
                       },

                    { title: "CURRENT VERSION", data: 'CurrentVersionName' },
                    {
                        title: "UPDATED",
                        data: null,
                        render: function (data, type, row) {
                            // Combine the first and last names into a single table field
                            if (data.IsUpdated) {
                                return '<span>Yes</span>';
                            }
                            else {
                                return '<span>No</span>';
                            }
                        },
                    },
                    { title: "ASSIGN VERSION", data: 'AssignedVersionName' },
                    { title: "IOS VERSION", data: 'IOSVersion' },
                    { title: "", data: 'CurrentVersion' },
                    {
                        title: "IPAD LOGIN",
                        data: null,
                        render: function (data, type, row) {
                            return '<span>' + JsonToDateTimeFormat(data.LastLoginDateTime) + '</span>';
                        },
                    }
                ]
            });
        }
    });
    ApplyCssOnList("Test");
}
// This function is bind user app version list which is used Test Version
function RebindAllVersionList() {
    $.ajax({
        type: "POST",
        url: _relativeBaseDirectory + "/Release/AllUserList",
        data: {},
        async: false,
        success: function (data) {
            var dataSet = [];
            dataSet = data;
            $('#tableAllList').DataTable({
                destroy: true,
                data: dataSet,
                columns: [
                       {
                           targets: 0,
                           sortable: false,
                           defaultContent: '',
                           //orderable: false,
                           "render": function (data, type, full, meta) {
                               return '<input type="checkbox" value="wibble">';
                           }
                       },
                       { title: "USER ID", data: 'UserID' },
                       {
                           title: "USER NAME",
                           data: null,
                           sclass: "amit",
                           render: function (data, type, row) {
                               // Combine the first and last names into a single table field
                               $(row).addClass('important');
                               return data.FirstName + ' ' + data.LastName;
                           },
                           editField: ['FirstName', 'LastName']
                       },

                    { title: "CURRENT VERSION", data: 'CurrentVersionName' },
                    {
                        title: "UPDATED",
                        data: null,
                        render: function (data, type, row) {
                            // Combine the first and last names into a single table field
                            if (data.IsUpdated) {
                                return '<span>Yes</span>';
                            }
                            else {
                                return '<span>No</span>';
                            }
                        },
                    },
                    { title: "ASSIGN VERSION", data: 'AssignedVersionName' },
                    { title: "IOS VERSION", data: 'IOSVersion' },
                    { title: "", data: 'CurrentVersion' },
                    {
                        title: "IPAD LOGIN",
                        data: null,
                        render: function (data, type, row) {
                            return '<span>' + JsonToDateTimeFormat(data.LastLoginDateTime) + '</span>';
                        },
                    }
                ]
            });
        }
    });
    ApplyCssOnList("All");
}

// This function is used to convert json date to real date as per format
function JsonToDateTimeFormat(dateAsFromServerSide) {
    var newdate = "";
    if (dateAsFromServerSide != null) {
        // ASP.NET Core sends ISO-8601 strings; the old ASP.NET MVC 5 sent /Date(ms)/. Accept both.
        var parsedDate = (typeof dateAsFromServerSide === 'string' && dateAsFromServerSide.indexOf('/Date(') === 0)
            ? new Date(parseInt(dateAsFromServerSide.substr(6)))
            : new Date(dateAsFromServerSide);
        var jsDate = new Date(parsedDate); //Date object
        var monthname = "";
        switch (parseInt(jsDate.getMonth() + 1)) {
            case 1:
                monthname = "Jan";
                break;
            case 2:
                monthname = "Feb";
                break;
            case 3:
                monthname = "Mar";
                break;
            case 4:
                monthname = "Apr";
                break;
            case 5:
                monthname = "May";
                break;
            case 6:
                monthname = "Jun";
                break;
            case 7:
                monthname = "Jul";
                break;
            case 8:
                monthname = "Aug";
                break;
            case 9:
                monthname = "Sep";
                break;
            case 10:
                monthname = "Oct";
                break;
            case 11:
                monthname = "Nov";
                break;
            case 12:
                monthname = "Dec";
                break;
        }
        var ampm = "pm";
        if (jsDate.getHours() <= 12) {
            ampm = "AM"
        }
        var hours = jsDate.getHours();
        if (hours <= 9) {
            hours = "0" + hours;
        }
        var min = jsDate.getMinutes();
        if (min <= 9) {
            min = "0" + min;
        }
        newdate = jsDate.getDate() + "-" + monthname + "-" + jsDate.getFullYear() + " " + hours + ":" + min + " " + ampm;
    }
    return newdate;
}
// The function is using popup the filter popup which is not using..
function ShowFilterPopup(versiontype) {
    $.ajax({
        type: "POST",
        url: _relativeBaseDirectory + "/Release/PopupProductionFilter",
        data: ({ 'VersionType': versiontype }),
        success: function (data) {
            $('#divFilters_dialog').html(data);
            ShowDialog(false, "divFilters_dialog");
            $("#txtPUserId").focus();
        }
    });
}
// Apply CSS class when create version list for test and production
function ApplyCssOnList(versiontype) {
    var divversionid = "";
    if (versiontype == "Test") {
        divversionid = "tableTestList";
    }
    if (versiontype == "All") {
        divversionid = "tableAllList";
    }
    else {
        divversionid = "tableProductionList";
    }
    if ($("#" + divversionid + " tr").length > 0) {
        //Apply CSS on table header
        $("#" + divversionid + " thead tr").each(function () {
            $(this).children('th').eq(0).removeClass("sorting_asc");//
            $(this).children('th').eq(2).addClass("td-username"); //Apply username in align-left
            $(this).children('th').eq(7).addClass("td_currentversionid"); //Apply username in align-left
        });
        //Apply CSS on table body
        var rows = $("#" + divversionid).dataTable().fnGetNodes();
        $(rows).each(function () {
            $(this).children('td').eq(2).addClass("td-username"); //Apply username in align-left
            $(this).children('td').eq(7).addClass("td_currentversionid"); //Apply username in align-left
        });
    }
}
// The function is open the assign version as per version type like Production or Test
function ShowAssignVersionPopup(versiontype) {
    var UserIDS = [];
    var UserNameS = [];
    var UserCurrentVersionList = [];
    var CurrentVersionIdList = [];
    var divversionid = "tableProductionList";
    if (versiontype == "Test") {
        divversionid = "tableTestList";
    }
    else if (versiontype == "All") {
        divversionid = "tableAllList";
    }
    var rows = $("#" + divversionid).dataTable().fnGetNodes();
    $(rows).each(function () {
        if ($(this).find("input").is(":checked")) {
            UserIDS.push($(this).children('td').eq(1).text());
            UserNameS.push($(this).children('td').eq(2).text());
            var conversion = $(this).children('td').eq(3).text();
            CurrentVersionIdList.push($(this).children('td').eq(7).text());
            if (conversion == null || conversion == "") {
                UserCurrentVersionList.push("0");
            }
            else {
                UserCurrentVersionList.push(conversion);
            }
            $(this).find('input').removeAttr("checked");
            //$(rows[iRow]).toggleClass('selected');
        }
    });
    $.ajax({
        type: "POST",
        url: _relativeBaseDirectory + "/Release/PopupAssignVersion",
        datatype: 'json',
        data: JSON.stringify({ 'VersionType': versiontype, 'UserIdList': UserIDS, 'UserNameList': UserNameS, 'UserCurrentVersions': UserCurrentVersionList, 'CurrentVersionIdList': CurrentVersionIdList }),
        async: false,
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            $('#AssignVersion_dialog').html(data);
            ShowDialog(false, "AssignVersion_dialog");
        }
    });
}

function SelectedUserID(chkid) {
    if ($(chkid).parent().hasClass("selected")) {
        $(chkid).parent().removeClass("selected");
    }
    else {
        $(chkid).parent().addClass("selected");
    }
}


function showMessage(msg, isError) {
    if (isError) {
        $('#msgContainer').attr('class', 'error');
    }
    else {
        $('#msgContainer').attr('class', 'warning');
    }
    $('#lblMessage').text(msg);
    $('#msgContainer').show();
}

function hideMessage() {
    $('#msgContainer').attr('class', '');
    $('#msgContainer').hide();
}
