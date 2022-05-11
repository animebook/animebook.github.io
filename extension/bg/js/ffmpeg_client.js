class FFmpegClient {
    constructor(ffmpeg, settings) {
        this.ffmpeg = ffmpeg;
        this.videoFile = ffmpeg.videoFile;
        this.settings = settings;
        this.ffmpegCommands = new FFmpegCommands(settings);
    }

    async recordAudio(start, end, audioTrack) {
        var command = this.ffmpegCommands.createAudioFFmpegCommand('/input/tmpfile', start, end, audioTrack);
        await this.ffmpeg.run(...command.commandArgs);
        const data = this.ffmpeg.FS('readFile', command.outputFileName);
        this.ffmpeg.FS('unlink', command.outputFileName);
        return data;
    }

    async takeScreenshot(screenshotTime, start, end) {
        var command = this.ffmpegCommands.createImageFFmpegCommand('/input/tmpfile', screenshotTime, start, end)
        await this.ffmpeg.run(...command.commandArgs);
        const data = this.ffmpeg.FS('readFile', command.outputFileName);
        this.ffmpeg.FS('unlink', command.outputFileName);
        return data;
    }

    async getAudioData(start, end, audioTrack) {
        const audioData = await this.recordAudio(start, end, audioTrack);
        const audioBlob = new Blob([audioData.buffer]);
        const audioBase64 = await (new BlobUtils().blobToBase64(audioBlob));
        const audioFileName = this.createName(start, end) + '.mp3';
        return [audioFileName, audioBlob, audioBase64];
    }

    async getImage(start, end, currentVideoTime) {
        const screenshotTime = (this.settings.imageTiming === 'currentFrame') ? currentVideoTime : ((start + end) / 2);
        const imageData = await this.takeScreenshot(screenshotTime, start, end);
        const imageBlob = new Blob([imageData.buffer]);
        const imageBase64 = await (new BlobUtils().blobToBase64(imageBlob));
        const imageFileName = this.createName(screenshotTime) + '.' + this.settings['imageFormat'];
        return [imageFileName, imageBase64]
    }

    async cleanAudio(audioBuffer) {
        const audioBlob = new Blob([audioBuffer]);
        const file = new File([audioBlob], "animebook_clean_audio.mp3")
        this.ffmpeg.FS('writeFile', file.name, new Uint8Array(audioBuffer));
        const command = this.ffmpegCommands.createCleanAudioCommand(file);
        await this.ffmpeg.run(...command.commandArgs);
        const audioData = this.ffmpeg.FS('readFile', command.outputFileName);
        this.ffmpeg.FS('unlink', command.outputFileName);
        return new Blob([audioData.buffer]);
    }

    guessEpisodeNumber(videoFileName) {
        var matches = videoFileName
            .replace(/[a-uw-zA-UW-Z]/g, "a")
            .replace(/[^a^\d]/g, " ")
            .split(" ")
            .filter(function (numText) { return numText && numText.indexOf("a") === -1});

        var episodeNumber = null;
        if (matches && !matches.every(numText => { return videoFileName.startsWith(numText); })) {
            episodeNumber = parseInt(matches[0]) + "";
        }
        return episodeNumber;
    }

    displayAsVideoTime(seconds) {
        return new Date(seconds * 1000).toISOString().substr(11, 8).replace(/^00:/g, '').replace(/:/g, '-');
    }

    splitUpWords(name) {
        return name.split(/(?:[\x00-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+|\W+)/g);
    }

    truncateText(text, charLimit) {
        return (text <= charLimit) ? text : text.substring(0, charLimit);
    }

    createShortName(fileName) {
        var wordLimit = 3;
        var characterLimit = 20;
        try {
            const noNoiseName = fileName.replace(/(\[.*?\]|\d+)/g, '').replace(/\.[a-zA-Z]{0,4}$/g, '').trim();
            var name = (noNoiseName || fileName)
            var allWords = this.splitUpWords(name).filter(word => word);
            var lessWords = [];
            for (var i = 0, length = 0; i < allWords.length && i < wordLimit; i++) {
                if ((length + allWords[i].length + 1) < characterLimit) {
                    length += allWords[i].length + 1;
                    lessWords.push(allWords[i]);
                }
                else
                    break;
            }
            var shortName = lessWords.join('-');
            if (!shortName)
                return this.truncateText(name, characterLimit);
            return shortName;
        }
        catch (e) {
            return this.truncateText(fileName, characterLimit);
        }
    }

    createName(...times) {
        const shortName = this.createShortName(this.videoFile.name);
        const episodeNumber = this.guessEpisodeNumber(this.videoFile.name)
        const timeStr = new TimeFormatter().createDateTimeString();
        const videoTimeStr = times.map(this.displayAsVideoTime).join('_');
        const episodeNumberStr = episodeNumber ? ('_' + episodeNumber) : '';
        return `ab_${shortName}${episodeNumberStr}_${videoTimeStr}_${timeStr}`;
    }
}