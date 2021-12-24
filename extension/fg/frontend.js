/**
 * TODO:
 * Fix Web_Accessible_Resources to make the extension work on at least all file::// urls and animebook
 * See if it's possible to not do all this stuff via iframe, but idk if that's even useful since we still have the problem of loading css on the fly, which will require Web_Accessible_Resources
 * (I think I need an iframe because objects can't be send over message passing to service workers, but we'll see I guess?)
 * 
 */
function main() {
    const dropWrapper = document.getElementById("animebook-drop-wrapper");
    if (!dropWrapper)
        return;

    injectStyles(chrome.runtime.getURL('fg/frontend.css'));

    const toaster = CREATE_TOAST_VUE_INSTANCE();
    const abIcons = new AbIcons();
    const captionUtils = new CaptionUtils();
    const eventChannel = new EventChannel();
    const token = generateIFrameToken();
    eventChannel.initializeIFrame(token);
    const cardCreator = new CardCreator(toaster, abIcons, captionUtils, token);

    dropWrapper.addEventListener("drop", e => onNewFileEvent(e.dataTransfer.files, abIcons, eventChannel, cardCreator, toaster));
    var observer = new MutationObserver((mutationsList, observer) => onHTMLMutation(mutationsList, cardCreator));
    var config = { childList: true, subtree: true };
    observer.observe(dropWrapper, config);

    const selectionHighlighter = new SelectionHighlighter(captionUtils);
    document.addEventListener('selectionchange', e => selectionHighlighter.onSelectionChange());
    document.addEventListener('keydown', e => handleKeyDown(e, cardCreator));

    const fileInput = document.getElementById("ab-file-browse-input")
    if (fileInput) {
        fileInput.addEventListener("change", e => {
            const files = fileInput.files;
            onNewFileEvent(files, abIcons, eventChannel, cardCreator, toaster);
        })
    }
}

function generateIFrameToken() {
    var buffer = new Uint8Array(64);
    crypto.getRandomValues(buffer);
    var random_token = '';
    for (var i = 0; i < buffer.length; ++i) {
        random_token += buffer[i].toString(36);
    }
    return random_token;
}

function injectStyles(url) {
    var elem = document.createElement('link');
    elem.rel = 'stylesheet';
    elem.setAttribute('href', url);
    document.body.appendChild(elem);
}

function onNewFileEvent(files, abIcons, eventChannel, cardCreator, toaster) {
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (isCaptions(file)) { 
            abIcons.clearExportIcons();
        } else {
            // Cloning the file is a workaround so file permissions don't get lost after  sending 
            // the file to an iframe, and then having that iframe send the file to a worker.
            // Problem documented here: https://bugs.chromium.org/p/chromium/issues/detail?id=631877
            // Solution found from duplicate issue https://bugs.chromium.org/p/chromium/issues/detail?id=866805
            const cloneFile = new File( [ file.slice( 0, file.size ) ], file.name, { type: file.type } );
            eventChannel.sendMessage({action: 'file', file: cloneFile}, event => {
                const response = event.data;
                if (response.type === 'error') {
                    toaster.$emit('add-error', { 
                        message: 'Failed to prepare video for anki export: ' + response.message,
                        stack: response.stack,
                        isUserFacing: response.isUserFacing
                    });
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
