class ForvoFetch {
    constructor(ffmpegWorker, settings) {
        this.ffmpegWorker = ffmpegWorker;
        this.settings = settings;
    }

    replaceNonAlphaNumericAscii(text, replacer) {
        return text.replace(/[\x00-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, replacer);
    }

    async fetchWordAudio(word) {
        try {
            const response = await fetch(`https://forvo.com/search/${word}/ja/`);
            const text = await response.text();
            const playFunctionMatches = text.match(/Play(.*)span/g);
            if (!playFunctionMatches || playFunctionMatches.length === 0)
                return null;
            const playParameterMatches = playFunctionMatches
                .map(playFunc => playFunc.match(/'(.*?)'/g).map(m => m.replace(/'/g, "")))
                .reduce((a,b) => a.concat(b), [])

            if (!playParameterMatches || playParameterMatches.length === 0)
                return null;

            var audioUrl = null;
            for (var i = 0; i < playParameterMatches.length; i++) {
                const decodedFromBase64 = atob(playParameterMatches[i]);
                if (decodedFromBase64.match(/\.mp3$/g)) {
                    audioUrl = 'https://audio00.forvo.com/mp3/' + decodedFromBase64;
                    break;
                }
            }

            if (!audioUrl)
                return null;

            const audioResp = await fetch(audioUrl);
            const audioData = await audioResp.arrayBuffer();
            const cleanAudioBlob = await this.ffmpegWorker.sendMessage({ type: 'cleanAudio', audioData: audioData, settings: this.settings });
            const audioBase64 = await new BlobUtils().blobToBase64(cleanAudioBlob);
            const audioFileName = 'ab_' + this.replaceNonAlphaNumericAscii(word, '_') + '_' + (new TimeFormatter().createDateTimeString()) + '.mp3';

            return [audioFileName, cleanAudioBlob, audioBase64];
        } catch (e) {
            console.error("Failed to fetch forvo audio: " + e.message);
            return null;
        }
    }
}