const ffmpegWorker = new PromiseWorker('/bg/js/ffmpeg_worker.js');
var updateFilePromise = Promise.resolve();
var loadFFmpegPromise = null;
var videoFile = null;
var iframeToken = null;

async function loadFFmpeg() {
    if (loadFFmpegPromise)
        return loadFFmpegPromise;

    loadFFmpegPromise = ffmpegWorker.sendMessage({type: 'load'});
    return loadFFmpegPromise;
}

async function overwriteVideoFile(newVideoFile) {
    await loadFFmpeg();
    await ffmpegWorker.sendMessage({ type: 'updateFile', file: newVideoFile });
    videoFile = newVideoFile;
}

async function updateVideoFile(newVideoFile) {
    updateFilePromise = updateFilePromise.then(() => {
        return overwriteVideoFile(newVideoFile);
    }).then(() => {
        return extractSubtitles();
    })
    return updateFilePromise;
}

function formatToExtension(format) {
    let ext = format.replaceAll(/\(.*?\)/g, '').trim()
    if (ext === 'subrip')
        return 'srt'
    return ext;
}

function parseVideoInfo(text) {
    let streams = text.split(/\s+(?=Stream #\d:\d+)/g)
    return streams.map(s => {
        let lines = s.split('\n')
        let streamInfo = lines[0].match(/^Stream\ #(\d+:\d+)\S+: Subtitle: (.*?)$/i)
        if (!streamInfo || streamInfo.length === 0)
            return null;

        let d = {}
        d.stream = streamInfo[1];
        d.format = streamInfo[2];
        d.extension = formatToExtension(d.format);

        for (let i = 1; i < lines.length; i++) {
            let titleMatch = lines[i].match(/title\s+:\s+(.*?)$/i)
            if (titleMatch) {
                d.title = titleMatch[1]
                break;
            }
        }
        return d;
    }).filter(stream => stream);
}

async function extractSubtitles() {
    if (!videoFile)
        throw new UserFacingError("No video file found");
    let subtitleStreams = await ffmpegWorker.sendMessage({ type: 'videoInfo' });
    
    console.log(subtitleStreams)
    console.log(parseVideoInfo(subtitleStreams));
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
        const forvoFetch = new ForvoFetch(ffmpegWorker, settings);
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
        const [audioFilename, audioBlob, audioBase64] = await ffmpegWorker.sendMessage({ type: 'getAudioData', start: start, end: end, audioTrack: audioTrack, settings: settings })
        promises.push(anki.storeMediaFile(audioFilename, audioBase64));
        expressionLookup['sentence-audio'] = `[sound:${audioFilename}]`;
        sentenceBlobToPlay = audioBlob;
    }

    if (neededExpressions.has('screenshot')) {
        const [imageFileName, imageBase64] = await ffmpegWorker.sendMessage({ type: 'getImage', start: start, end: end, time: currentVideoTime, settings: settings });
        promises.push(anki.storeMediaFile(imageFileName, imageBase64));
        expressionLookup['screenshot'] = `<img src="${imageFileName}">`;
        screenshotToSendBack = imageBase64;
    }

    if(neededExpressions.has('filename')) {
        expressionLookup['filename'] = videoFile.name;
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
    
    var message = "Updated card!";
    if (expression)
        message = "Updated " + expression + "!";

    return { 
        type: "card-created", 
        message: message,
        sentence: regexOnlyText,
        image: screenshotToSendBack,
        imageFormat: settings.imageFormat,
        audioList: audioList
    };

}

async function handleMessage(request) {
    if (crossOriginIsolated)
        console.log('Can use SharedArrayBuffer from background')
    try {
        if (request.action === 'file') {
            await updateVideoFile(request.file);
            return { type: 'file-loading', message: 'Loaded file into ffmpeg'};
        }
        else if (request.action === 'record') {
            return await recordFlashcard(request.lines, request.start, request.end, request.currentVideoTime, request.audioTrack || 0)
        } else if (request.action === 'subtitles') {
            return await extractSubtitles();
        } else if (request.action === 'token') {
            iframeToken = request.token;
            return { type: 'token', message: 'Updated token'};
        }
        else {
            return { type: 'bad-request', message: 'Bad request' };
        }
    } catch (error) {
        return serializeError(error);
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (iframeToken && request.token && iframeToken !== request.token) {
            console.warn('A separate tab is trying to record a flashcard in this tab. Ignoring request...')
            return false; 
        }

        handleMessage(request).then(response => {
            sendResponse(response);
        })
        return true;
    }
)

window.onmessage = e => {
    handleMessage(e.data).then(response => {
        if (e.ports[0])
            e.ports[0].postMessage(response);
    });
};