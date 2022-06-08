class AbIcons {
    
    setSpinner(captionId) {
        var ankiExport = document.getElementById("anki-export-" + captionId)
        ankiExport.style = "grid-template-rows: calc(100% - 24px) auto 0 0;";
        this.enableSpinnerAnimation(ankiExport);
    }

    setSuccess(captionId) {
        var ankiExport = document.getElementById("anki-export-" + captionId)
        ankiExport.style = "grid-template-rows: calc(100% - 24px) 0 auto 0;";
        this.disableSpinnerAnimation(ankiExport);
    }

    setAlert(captionId) {
        var ankiExport = document.getElementById("anki-export-" + captionId)
        ankiExport.style = "grid-template-rows: calc(100% - 24px) 0 0 auto;";
        this.disableSpinnerAnimation(ankiExport);
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

    enableSpinnerAnimation(ankiExport) {
        ankiExport.querySelector(".spinner-icon").style = "animation: rotate 1s infinite 0s steps(8)";
    }

    disableSpinnerAnimation(ankiExport) {
        ankiExport.querySelector(".spinner-icon").style = ""
    }
}