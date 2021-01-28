class ForvoFetch {
    constructor(ffmpegClient) {
        this.ffmpegClient = ffmpegClient;
    }

    async fetchWordAudio(word) {
        try {
            const response = await fetch(`https://forvo.com/search/${word}/ja/`);
            const text = await response.text();
            const playFunctionMatches = text.match(/Play(.*)span/g);
            if (!playFunctionMatches || playFunctionMatches.length === 0)
                return null;
            const playParameterMatches = playFunctionMatches
                .map(playFunc => playFunc.match(/'(.*?)'/g).map(m => m.replaceAll("'", "")))
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
            const cleanAudioBlob = await this.ffmpegClient.cleanAudio(audioData);
            const audioBase64 = await new BlobUtils().blobToBase64(cleanAudioBlob);
            const audioFileName = 'ab_' + word.replaceAll(/\w/g, '_') + '_' + (new TimeFormatter().createDateTimeString()) + '.mp3';

            return [audioFileName, cleanAudioBlob, audioBase64];
        } catch (e) {
            console.error("Failed to fetch forvo audio: " + e.message);
            return null;
        }
    }
}