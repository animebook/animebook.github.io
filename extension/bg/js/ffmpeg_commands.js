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
                `-ss`, `${(start).toFixed(3)}`,
                `-to`, `${(end).toFixed(3)}`,
                `-i`, `${videoFileName}`,
                `-map`, `0:a:${audioTrack}`,
                ...effectFlags,
                this.settings.audioFfmpegFlags,
                `output.mp3`
            ].filter(arg => arg)
        }
    }

    createImageFFmpegCommand(videoFileName, screenshotTime, start, end) {
        var vfArgs = [];
        if (this.settings['imageFormat'] === 'png')
            vfArgs.push(`format=rgb24`);

        var startTime = screenshotTime.toFixed(3);
        var endTimeArgs = [];
        var vframesArgs = [`-vframes:v`, `1`];
        if (this.settings['imageFormat'] === 'gif') {
            startTime = start.toFixed(3);
            endTimeArgs.push('-to', end.toFixed(3));
            vframesArgs = [];
            vfArgs.push(`fps=${this.settings['gifFPS']}`);
        }

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
                `-ss`, `${startTime}`,
                ...endTimeArgs,
                `-i`, `${videoFileName}`,
                ...vframesArgs,
                `-qscale:v`, `2`,
                ...vfCommand,
                this.settings.imageFfmpegFlags,
                fileName
            ].filter(arg => arg)
        }
    }

    createCleanAudioCommand(audioFile) {
        var audioFilterFlags = [];
        audioFilterFlags.push(`volume=${this.settings.forvoAudioVolumeMultiplier}`)
        audioFilterFlags.push('lowpass=3000')
        audioFilterFlags.push('highpass=200')
        audioFilterFlags.push('areverse')
        audioFilterFlags.push('silenceremove=1:0:-50dB')
        audioFilterFlags.push('areverse')

        var effectFlags = [`-af`, audioFilterFlags.join(',')];
        var fileName = 'output.mp3'

        return {
            outputFileName: fileName,
            commandArgs: [
                `-i`, `${audioFile.name}`,
                ...effectFlags,
                fileName
            ].filter(arg => arg)
        }
    }
}