self.importScripts(
    'ffmpeg/ffmpeg-core.js', 
    'ffmpeg.js',
    'time_formatter.js', 
    'errors.js', 
    'blob_utils.js', 
    'ffmpeg_commands.js',
    'ffmpeg_client.js'
);

var ffmpeg = new FFmpeg();

handleMessage = async (message) => {
    const ffmpegClient = new FFmpegClient(ffmpeg, message.settings);
    switch (message.type) {
        case 'load':
            return await ffmpeg.load();
        case 'updateFile':
            ffmpeg.updateFile(message.file);
            return 'Updated file';
        case 'getAudioData':
            return await ffmpegClient.getAudioData(message.start, message.end, message.audioTrack);
        case 'getImage':
            return await ffmpegClient.getImage(message.start, message.end, message.time);
        case 'cleanAudio':
            return await ffmpegClient.cleanAudio(message.audioData);
    }
}

onmessage = function (e) {
    const message = e.data;
    handleMessage(message).then(result => {
        self.postMessage({ id: message.id, payload: result});
    }).catch(error => {
        self.postMessage({ id: message.id, err: { message: error.message, stack: error.stack, name: error.name } });
    })
}
