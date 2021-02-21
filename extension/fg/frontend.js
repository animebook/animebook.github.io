function main() {
    const dropWrapper = document.getElementById("animebook-drop-wrapper");
    if (!dropWrapper)
        return;

    injectStyles(chrome.extension.getURL('fg/frontend.css'));

    const toaster = CREATE_TOAST_VUE_INSTANCE();
    const abIcons = new AbIcons();
    const captionUtils = new CaptionUtils();
    const eventChannel = new EventChannel();
    eventChannel.loadFrameAndFlush();
    const cardCreator = new CardCreator(toaster, abIcons, captionUtils);

    dropWrapper.addEventListener("drop", e => onDropEvent(e, abIcons, eventChannel, cardCreator, toaster));
    var observer = new MutationObserver((mutationsList, observer) => onHTMLMutation(mutationsList, cardCreator));
    var config = { childList: true, subtree: true };
    observer.observe(dropWrapper, config);

    const selectionHighlighter = new SelectionHighlighter(captionUtils);
    document.addEventListener('selectionchange', e => selectionHighlighter.onSelectionChange());
    document.addEventListener('keydown', e => handleKeyDown(e, cardCreator));
}

function injectStyles(url) {
    var elem = document.createElement('link');
    elem.rel = 'stylesheet';
    elem.setAttribute('href', url);
    document.body.appendChild(elem);
}

function onDropEvent (e, abIcons, eventChannel, cardCreator, toaster) {
    for (var i = 0; i < e.dataTransfer.files.length; i++) {
        var file = e.dataTransfer.files[i];
        if (isCaptions(file)) { 
            abIcons.clearExportIcons();
        } else {
            eventChannel.sendMessage({action: 'file', file: file}, event => {
                const response = event.data;
                if (response.type === 'error') {
                    toaster.$emit('add-error', { 
                        message: 'Failed to prepare video for anki export: ' + response.message,
                        isUserFacing: response.isUserFacing 
                    });
                } else {
                    cardCreator.setVideoFileName(file.name);
                }
            });
        }
    }
}

function isCaptions(file) {
    return /\.(vtt|srt|ass|ssa)$/i.test(file.name);
}

function onHTMLMutation(mutationsList, cardCreator) {
    for (let mutation of mutationsList) {
        if (mutation.type !== "childList") {
            return;
        }

        mutation.addedNodes.forEach(function (elem) {
            var exportButtons = elem.querySelectorAll && elem.querySelectorAll('.export-to-recent');
            if (!exportButtons || exportButtons.length === 0)
                return;
            exportButtons.forEach(function (exportButton) {
                exportButton.addEventListener('click', function (e) { 
                    cardCreator.addCard(exportButton.getAttribute('data-caption-id'));
                });
            })
        })
    }
};

function handleKeyDown(e, cardCreator) {
    switch (e.key) {
        case 'e':
        case 'E':
            if (e.ctrlKey || e.altKey || e.metaKey)
                return;
            const caption = document.querySelector('.caption.active');
            if (!caption || !caption.getAttribute('data-caption-id'))
                return;

            const selectionRange = cardCreator.findSelectionRange(window.getSelection());
            const start = (selectionRange && selectionRange.length > 0) ? selectionRange[0] : caption;
            const id = start.getAttribute('data-caption-id');
            cardCreator.addCard(id);
            break;
        default:
            break;
    }
}



main();
