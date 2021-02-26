var videoFile = null;

var updateFilePromise = Promise.resolve();
var loadFFmpegPromise = null;

function isCaptions(file) {
    return /\.(vtt|srt|ass|ssa)$/i.test(file.name);
}

async function loadFFmpeg() {
    if (loadFFmpegPromise)
        return loadFFmpegPromise;

    loadFFmpegPromise = new FFmpegClient().load();
    return loadFFmpegPromise;
}

async function overwriteVideoFile(newVideoFile) {
    await loadFFmpeg();

    if (videoFile)
        await AB_FFMPEG_UNLINK_FILE(videoFile);

    videoFile = newVideoFile;
    await AB_FFMPEG_WRITE_FILE(videoFile);
}

function updateVideoFile(newVideoFile) {
    updateFilePromise = updateFilePromise.then(() => {
        return overwriteVideoFile(newVideoFile);
    })
}

async function createPlayingAudioElement(audioBlob) {
    const audio = document.createElement("audio");
    audio.id = "audio-element";
    audio.controls = true;
    audio.src = URL.createObjectURL(audioBlob);
    const existingElement = document.getElementById(audio.id);
    if (existingElement)
        existingElement.remove();
    document.body.appendChild(audio);
    await audio.play();
    return audio;
}

async function playAudio(audioList) {
    if (audioList.length == 0)
        return;

    const audio = await createPlayingAudioElement(audioList[0])
    audio.onended = () => playAudio(audioList.slice(1))
}

async function recordFlashcard(lines, start, end, currentVideoTime, audioTrack) {
    if (!videoFile)
        throw new UserFacingError("No video file found");

    const settings = await AB_GET_SETTINGS();
    if (!settings.ankiDeck)
        throw new UserFacingError("No Anki deck found to export to. Please choose a deck on the Animebook extension's settings page.");
    if (!settings.ankiModel)
        throw new UserFacingError("No Anki model found to export to. Please choose a model on the Animebook extension's settings page.");
    if (settings.ankiFieldTemplates.length === 0)
        throw new UserFacingError("Anki export options not configured yet");

    const anki = new AnkiConnect(settings);
    const templateCompiler = new TemplateCompiler(settings);

    await updateFilePromise;
    const ffmpegClient = new FFmpegClient(videoFile, settings);

    const recentNoteIds = await anki.findRecentNoteIds();
    const latestId = recentNoteIds.result.reduce((a,b) => Math.max(a,b), -1);
    if (!latestId || latestId === -1)
        throw new UserFacingError("No anki card to export to. Please add a card the following deck first: " + settings.ankiDeck);
    const latestNotes = (await anki.findNoteInfoByIds([latestId])).result;
    if (!latestNotes || latestNotes.length === 0)
        throw new UserFacingError("No anki card to export to");
    const latestNote = latestNotes[0];
    const neededExpressions = templateCompiler.findNeededExpressions(latestNote);

    var promises = [];
    var expressionLookup  = {}
    var screenshotToSendBack = null;
    var wordBlobToPlay = null;
    var sentenceBlobToPlay = null;

    var expression = null;
    if (settings.ankiVocabField && latestNote.fields[settings.ankiVocabField])
        expression = latestNote.fields[settings.ankiVocabField].value;

    if (neededExpressions.has('forvo-word-audio') && expression) {
        const forvoFetch = new ForvoFetch(ffmpegClient);
        const wordAudioObj = await forvoFetch.fetchWordAudio(expression)
        if (wordAudioObj) {
            const [wordAudioFilename, wordBlob, wordAudioBase64] = wordAudioObj;
            expressionLookup['forvo-word-audio'] = `[sound:${wordAudioFilename}]`
            wordBlobToPlay = wordBlob;
            promises.push(anki.storeMediaFile(wordAudioFilename, wordAudioBase64));
        } else {
            expressionLookup['forvo-word-audio'] = ''
        }
    } else if (neededExpressions.has('forvo-word-audio')) {
            expressionLookup['forvo-word-audio'] = ''
    }

    if (neededExpressions.has('sentence-audio')) {
        const [audioFilename, audioBlob, audioBase64] = await ffmpegClient.getAudioData(start, end, audioTrack);
        promises.push(anki.storeMediaFile(audioFilename, audioBase64));
        expressionLookup['sentence-audio'] = `[sound:${audioFilename}]`;
        sentenceBlobToPlay = audioBlob;
    }

    if (neededExpressions.has('screenshot')) {
        const [imageFileName, imageBase64] = await ffmpegClient.getImage(start, end, currentVideoTime);
        promises.push(anki.storeMediaFile(imageFileName, imageBase64));
        expressionLookup['screenshot'] = `<img src="${imageFileName}">`;
        screenshotToSendBack = imageBase64;
    }

    await Promise.all(promises);

    const replacer = new SentenceFormatter(settings)
    const [regexOnlyText, fullyProccessedText] = replacer.updateLines(lines);
    expressionLookup['sentence'] = fullyProccessedText;

    var fieldMap = templateCompiler.createFieldMap(expressionLookup, latestNote)
    if (Object.keys(fieldMap).length === 0)
        throw new UserFacingError("Nothing updated. Please fill out the fields section on the Animebook extension's settings page.");

    const shouldSearchAnkiBrowser = settings.ankiBrowserFinalDisplay !== 'none';
    if (shouldSearchAnkiBrowser)
        await anki.showNoCardsInGui();

    await anki.updateNoteFields({
      id: latestId,
      fields: fieldMap,
    });

    if (shouldSearchAnkiBrowser) {
        await anki.showNoteInGui(latestId);
        if (settings.ankiBrowserFinalDisplay === 'currentDeck')
            await anki.showCurrentDeckInGui();
        else if (settings.ankiBrowserFinalDisplay === 'customQuery')
            await anki.runCustomBrowserQuery(settings.ankiBrowserFinalQuery);
    }

    var audioList = [];
    if (settings.forvoAudioPlayback === 'autoPlay' && wordBlobToPlay)
        audioList.push(wordBlobToPlay);

    if (settings.audioPlayback === 'autoPlay' && sentenceBlobToPlay)
        audioList.push(sentenceBlobToPlay);
    
    playAudio(audioList);

    var message = "Updated card!";
    if (expression)
        message = "Updated " + expression + "!";

    return { 
        type: "card-created", 
        message: message,
        sentence: regexOnlyText,
        image: screenshotToSendBack,
        imageFormat: settings.imageFormat
    };

}

async function handleMessage(request) {
    try {
        if (request.action === 'file') {
            updateVideoFile(request.file);
            return { type: 'file-loading', message: 'File is being loaded by ffmpeg'};
        }
        else if (request.action === 'record') {
            return await recordFlashcard(request.lines, request.start, request.end, request.currentVideoTime, request.audioTrack || 0, request.videoFileName)
        } else {
            return { type: 'bad-request', message: 'Bad request' };
        }
    } catch (error) {
        return serializeError(error);
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === 'record' && videoFile && request.videoFileName && videoFile.name !== request.videoFileName)
            return false; // Ignore. A background tab is being asked to record a flashcard.

        handleMessage(request).then(response => {
            sendResponse(response);
        })
        return true;
    }
)

window.onmessage = e => {
    handleMessage(e.data).then(response => {
        e.ports[0].postMessage(response);
    });
};