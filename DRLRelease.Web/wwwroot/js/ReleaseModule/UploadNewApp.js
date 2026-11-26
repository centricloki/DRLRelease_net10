// UploadNewApp page script
function getNameFromPath(strFilepath) {
    var objRE = new RegExp(/([^\/\\]+)$/);
    var strName = objRE.exec(strFilepath);
    return strName ? strName[0] : null;
}

function checkfile(ctrlid, ext) {
    var $ctrl = $('#' + ctrlid);
    var $msg = $ctrl.next('.field-validation-error, .field-validation-valid');
    $msg.removeClass('field-validation-error').addClass('field-validation-valid').text("");

    var filepath = $ctrl.val();
    if (!filepath) return true;

    var file = getNameFromPath(filepath);
    if (file != null) {
        var extension = file.substr((file.lastIndexOf('.') + 1)).toLowerCase();
        if (extension === ext.toLowerCase()) {
            return true;
        } else {
            $msg.text("You can upload only ." + ext + " extension file");
            $msg.removeClass('field-validation-valid').addClass('field-validation-error');
            return false;
        }
    }
    return true;
}

$(document).ready(function () {
    $("#btnUploadClear").click(function () {
        $('#fileUpPLIST').val("");
        $('#fileUpIPA').val("");
        $('#fileUpPLIST').next().removeClass('field-validation-error').addClass('field-validation-valid').text("");
        $('#fileUpIPA').next().removeClass('field-validation-error').addClass('field-validation-valid').text("");
    });

    $(document).on("click", "#btnSubmit", function (e) {
        $('#fileUpPLIST').next().removeClass('field-validation-error').addClass('field-validation-valid').text("");
        $('#fileUpIPA').next().removeClass('field-validation-error').addClass('field-validation-valid').text("");

        var result = true;

        if ($('#fileUpIPA').val() === "") {
            $('#fileUpIPA').next().html("Please upload .msixbundle file");
            $('#fileUpIPA').next().removeClass('field-validation-valid').addClass('field-validation-error');
            result = false;
        } else if (!checkfile('fileUpIPA', 'msixbundle')) {
            result = false;
        }

        if ($('#fileUpPLIST').val() === "") {
            $('#fileUpPLIST').next().html("Please upload .xml file");
            $('#fileUpPLIST').next().removeClass('field-validation-valid').addClass('field-validation-error');
            result = false;
        } else if (!checkfile('fileUpPLIST', 'xml')) {
            result = false;
        }

        if (!result) {
            e.preventDefault();
        }
        return result;
    });

    $("#fileUpIPA").change(function () {
        checkfile('fileUpIPA', 'msixbundle');
    });

    $("#fileUpPLIST").change(function () {
        checkfile('fileUpPLIST', 'xml');
    });

    // Add button loader on form submit
    $('#formuploadnewapp').on('submit', function () {
        var $btn = $('#btnSubmit');
        setButtonLoading($btn, true, 'Uploading...');
    });
});
