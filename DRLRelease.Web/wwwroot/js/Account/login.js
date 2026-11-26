// Login page script
$(document).ready(function () {
    function setHeight() {
        var windowHeight = $(window).innerHeight();
        $('.main-content').css('min-height', (windowHeight + 169));
    }

    setHeight();
    $(window).resize(function () {
        setHeight();
    });
});
