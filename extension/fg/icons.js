class AbIcons {
    
    setSpinner(captionId) {
        var ankiExport = document.getElementById("anki-export-" + captionId)
        ankiExport.style = "grid-template-rows: 24px auto 0 0;";
    }

    setSuccess(captionId) {
        var ankiExport = document.getElementById("anki-export-" + captionId)
        ankiExport.style = "grid-template-rows: 24px 0 auto 0;";
    }

    setAlert(captionId) {
        var ankiExport = document.getElementById("anki-export-" + captionId)
        ankiExport.style = "grid-template-rows: 24px 0 0 auto;";
    }

    disableAll() {
        var elements = document.getElementsByClassName('export-to-recent')
        Array.from(elements).forEach(el => el.classList.add('running'));
    }

    reEnableAll() {
        var elements = document.getElementsByClassName('export-to-recent')
        Array.from(elements).forEach(el => el.classList.remove('running'));
    }

    clearExportIcons() {
        var elements = document.getElementsByClassName('anki-export');
        Array.from(elements).forEach(el => el.style = '');
    }
    
}