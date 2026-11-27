// Shared global helpers and layout behaviors
var _relativeBaseDirectory = $('meta[name="app-base-url"]').attr('content') || '';

function getAppUrl(path) {
    if (!path) return _relativeBaseDirectory || '/';
    return (_relativeBaseDirectory || '') + (path.charAt(0) === '/' ? path : '/' + path);
}

/* ------------------------------------------------------------
   Numeric version ordering for DataTables (shared by every grid).
   Dotted versions are strings, so the default comparator orders
   "1.9.101" before "1.9.44" ('1' < '4'). This plug-in compares
   each numeric component instead.

   The sort key is a fixed-width zero-padded STRING compared as a
   string. A numeric key is deliberately avoided: 4 components x
   6 digits exceeds Number.MAX_SAFE_INTEGER (2^53) and would
   silently mis-order large build numbers.

   Usage:  { title: "VERSION", data: 'Version', type: 'drl-version' }
   ------------------------------------------------------------ */
(function ($) {
    if (!$ || !$.fn || !$.fn.dataTable || !$.fn.dataTable.ext) { return; }

    var order = $.fn.dataTable.ext.type.order;
    if (order['drl-version-pre']) { return; } // register exactly once

    function versionKey(value) {
        if (value === null || value === undefined) { return '000000000000000000000000'; }
        var parts = String(value).replace(/[^0-9.]/g, '').split('.');
        var key = '';
        for (var i = 0; i < 4; i++) {
            var n = parseInt(parts[i], 10);
            if (isNaN(n) || n < 0) { n = 0; }
            if (n > 999999) { n = 999999; }
            key += ('000000' + n).slice(-6);
        }
        return key;
    }

    function cmp(a, b) { return a < b ? -1 : (a > b ? 1 : 0); }

    order['drl-version-pre'] = versionKey;
    order['drl-version-asc'] = cmp;
    order['drl-version-desc'] = function (a, b) { return cmp(b, a); };
})(window.jQuery);

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