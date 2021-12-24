class AudioPlayer {
    async playAudio(audioList) {
        if (audioList.length == 0)
            return;

        const audio = await this.createPlayingAudioElement(audioList[0])
        audio.onended = () => this.playAudio(audioList.slice(1))
    }

    async createPlayingAudioElement(audioBlob) {
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
}