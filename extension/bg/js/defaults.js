const AB_DEFAULT_OPTIONS = {    
    ankiDeck: null,
    ankiModel: null,
    ankiVocabField: null,
    ankiFieldTemplates: [],
    ankiBrowserFinalDisplay: 'currentDeck',
    ankiBrowserFinalQuery: 'deck:current',
    newlineBehavior: "divs",
    sentenceReplacements: [],
    imageResizeSelection: "height",
    imageResizeHeight: 720,
    imageResizeWidth: 1280,
    gifFPS: 6,
    imageFormat: "jpg",
    imageTiming: "middle",
    imageFfmpegFlags: "",
    audioVolumeMultiplier: 1.0,
    audioClipPadding: 0.5,
    audioClipFade: 0.2,
    audioPlayback: 'autoPlay',
    audioFfmpegFlags: "",
    forvoAudioPlayback: 'autoPlay',
    forvoAudioVolumeMultiplier: 1.0,
    ankiServer: "http://127.0.0.1:8765"
}

const AB_TEMPLATE_EXPRESSIONS = [
    "sentence",
    "sentence-audio",
    "screenshot",
    "forvo-word-audio",
    "filename"
]

const AB_SANITIZE_SETTINGS = function (settings) {
    var safeSettings = null;
    if (!settings)
        safeSettings = JSON.parse(JSON.stringify(AB_DEFAULT_OPTIONS));
    else
        safeSettings = settings;

    for (var key in AB_DEFAULT_OPTIONS) {
        if (!safeSettings.hasOwnProperty(key))
            safeSettings[key] = AB_DEFAULT_OPTIONS[key];
    }

    return safeSettings;
}

const AB_GET_SETTINGS = function () {
    return new Promise(function (resolve) {
        chrome.storage.local.get(['settings'], function(obj) {
            resolve(AB_SANITIZE_SETTINGS(obj ? obj.settings : null));
        })
    })
}