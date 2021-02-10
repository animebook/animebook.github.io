const AB_INTERNAL_FFMPEG = FFmpeg.createFFmpeg({ log: true, corePath: "/bg/js/ffmpeg/ffmpeg-core.js" });

const AB_FFMPEG_WRITE_FILE = async (videoFile) => {
    return await AB_INTERNAL_FFMPEG.FS('writeFile', new FFmpegCommands(null).makeFileNameSafe(videoFile.name), await FFmpeg.fetchFile(videoFile));
}
const AB_FFMPEG_UNLINK_FILE = async (videoFile) => {
    return await AB_INTERNAL_FFMPEG.FS('unlink', new FFmpegCommands(null).makeFileNameSafe(videoFile.name));
}
class FFmpegClient {
    constructor(videoFile, settings) {
        this.ffmpeg = AB_INTERNAL_FFMPEG;
        this.videoFile = videoFile;
        this.settings = settings;
        this.ffmpegCommands = new FFmpegCommands(settings);
    }

    async load() {
        if (!this.ffmpeg.isLoaded()) {
            await this.ffmpeg.load();
            return "Loaded ffmpeg";
        }
        else {
            return "ffmpeg is already loaded";
        }
    }

    async recordAudio(start, end, audioTrack) {
        var command = this.ffmpegCommands.createAudioFFmpegCommand(this.videoFile.name, start, end, audioTrack);
        await this.ffmpeg.run(...command.commandArgs);
        const data = this.ffmpeg.FS('readFile', command.outputFileName);
        this.ffmpeg.FS('unlink', command.outputFileName);
        return data;
    }

    async takeScreenshot(time) {
        var command = this.ffmpegCommands.createImageFFmpegCommand(this.videoFile.name, time)
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
        const imageData = await this.takeScreenshot(screenshotTime);
        const imageBlob = new Blob([imageData.buffer]);
        const imageBase64 = await (new BlobUtils().blobToBase64(imageBlob));
        const imageFileName = this.createName(screenshotTime) + '.' + this.settings['imageFormat'];
        return [imageFileName, imageBase64]
    }

    async cleanAudio(audioBuffer) {
        const audioBlob = new Blob([audioBuffer]);
        const file = new File([audioBlob], "animebook_clean_audio.mp3")
        await AB_INTERNAL_FFMPEG.FS('writeFile', this.ffmpegCommands.makeFileNameSafe(file.name), new Uint8Array(audioBuffer));
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

    createName(...times) {
        var wordLimit = 3;
        var characterLimit = 18;
        const episodeNumber = this.guessEpisodeNumber(this.videoFile.name)
        const noNoiseName = this.videoFile.name.replace(/(\[.*?\]|\d+)/g, '').replace(/\.[a-zA-Z]{0,4}$/g, '').trim();
        var name = (noNoiseName || this.videoFile.name)
        var allWords = name.split(/\W/g).filter(word => word);
        var lessWords = [];
        for (var i = 0, length = 0; i < allWords.length && i < wordLimit; i++) {
            if (length + allWords[i].length < characterLimit) {
                length += allWords[i].length;
                lessWords.push(allWords[i]);
            }
            else
                break;
        }
        var shortName = lessWords.join('-');
        if (!shortName)
            shortName = (allWords[0] <= characterLimit) ? allWords[0] : allWords[0].substring(0, characterLimit)
        const timeStr = new TimeFormatter().createDateTimeString();
        const videoTimeStr = times.map(this.displayAsVideoTime).join('_');
        const episodeNumberStr = episodeNumber ? ('_' + episodeNumber) : '';
        return `ab_${shortName}${episodeNumberStr}_${videoTimeStr}_${timeStr}`;
    }
}