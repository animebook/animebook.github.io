class FFmpegCommands {
    constructor(settings) {
        this.settings = settings;
    }

    createAudioFFmpegCommand(videoFileName, start, end, audioTrack) {
        var audioClipPadding = this.settings['audioClipPadding'];
        var audioClipFade = this.settings['audioClipFade'];
        start = Math.max(0, start - audioClipPadding);
        end = end + audioClipPadding;
        var time = end - start;
        audioClipFade = Math.min(audioClipFade, time / 2);

        var audioFilterFlags = [`volume=${this.settings.audioVolumeMultiplier}`];
        if (audioClipFade > 0) {
            audioFilterFlags.push(`afade=t=in:curve=ipar:st=${0}:d=${audioClipFade}`)
            audioFilterFlags.push(`afade=t=out:curve=ipar:st=${time - audioClipFade}:d=${audioClipFade}`)
        }

        var effectFlags = []
        if (audioFilterFlags.length > 0)
            effectFlags = [`-af`, audioFilterFlags.join(',')];

        var fileName = 'output.mp3'

        return {
            outputFileName: fileName,
            commandArgs: [
                `-y`,
                `-ss`, `${(start).toFixed(3)}`,
                `-to`, `${(end).toFixed(3)}`,
                `-i`, `${this.makeFileNameSafe(videoFileName)}`,
                `-map`, `0:a:${audioTrack}`,
                ...effectFlags,
                this.settings.audioFfmpegFlags,
                `output.mp3`
            ].filter(arg => arg)
        }
    }

    createImageFFmpegCommand(videoFileName, time) {
        var vfArgs = [];
        if (this.settings['imageFormat'] === 'png')
            vfArgs.push(`format=rgb24`);
        
        if (this.settings['imageResizeSelection'] === 'height') {
            vfArgs.push(`scale=-2:${this.settings['imageResizeHeight']}`)
        }

        if (this.settings['imageResizeSelection'] === 'width') {
            vfArgs.push(`scale=${this.settings['imageResizeWidth']}:-2`)
        }

        var vfCommand = [];
        if (vfArgs.length > 0)
            vfCommand = ['-vf', vfArgs.join(",")];
        
        var fileName = `output.` + this.settings['imageFormat']

        return {
            outputFileName: fileName,
            commandArgs: [
                `-y`,
                `-ss`, `${time.toFixed(3)}`,
                `-i`, `${this.makeFileNameSafe(videoFileName)}`,
                `-vframes:v`, `1`,
                `-qscale:v`, `2`,
                ...vfCommand,
                this.settings.imageFfmpegFlags,
                fileName
            ].filter(arg => arg)
        }
    }

    makeFileNameSafe(fileName) {
        // Unicode filenames don't work with ffmpeg.wasm :(
        var noUnicodeFileName = fileName.replaceAll(/[^\x00-\x7F]+/g, '');
        return "'" + noUnicodeFileName.replaceAll("'", "'\\''") + "'"
    }
}