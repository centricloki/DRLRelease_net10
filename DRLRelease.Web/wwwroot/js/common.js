// Shared global helpers and layout behaviors
var _relativeBaseDirectory = $('meta[name="app-base-url"]').attr('content') || '';

function getAppUrl(path) {
    if (!path) return _relativeBaseDirectory || '/';
    return (_relativeBaseDirectory || '') + (path.charAt(0) === '/' ? path : '/' + path);
}

function setButtonLoading($btn, isLoading, loadingText) {
    if (!$btn || !$btn.length) return;
    var isInput = $btn.is('input');
    if (isLoading) {
        var orig = isInput ? $btn.val() : $btn.text();
        $btn.data('original-text', orig).prop('disabled', true);
        if (isInput) {
            $btn.val(loadingText || 'Processing...');
        } else {
            $btn.text(loadingText || 'Processing...');
        }
    } else {
        var restored = $btn.data('original-text') || 'Submit';
        $btn.prop('disabled', false);
        if (isInput) {
            $btn.val(restored);
        } else {
            $btn.text(restored);
        }
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
    if (modal) {
        $("#overlay").unbind("click");
    } else {
        $("#overlay").off("click").on("click", function () {
            HideDialog(popupid);
        });
    }
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
    var d = (typeof v === 'string' && v.indexOf('/Date(') === 0) ? new Date(parseInt(v.substr(6), 10)) : new Date(v);
    if (isNaN(d.getTime())) return v;
    var m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    var mi = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
    return d.getDate() + "-" + m[d.getMonth()] + "-" + d.getFullYear() + " " + h + ":" + mi + " " + ap;
}

function LogMeOut() {
    var logoutForm = document.getElementById('logoutForm');
    if (logoutForm) {
        logoutForm.submit();
        return;
    }
    $.ajax({
        type: "POST",
        url: getAppUrl("/Account/LogOff"),
        success: function () {
            window.location.href = getAppUrl("/Account/Login");
        }
    });
}

$(document).ready(function () {
    if ($('#msgContainer').length) {
        $('#msgContainer').hide();
    }

    if ($('.header-image').length) {
        function setHeaderImageHeight() {
            var windowHeight = $(window).innerHeight();
            $('.header-image').css('min-height', (windowHeight - 207));
        }

        setHeaderImageHeight();
        $(window).resize(function () {
            setHeaderImageHeight();
        });
    }
});
