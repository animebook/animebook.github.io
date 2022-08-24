class CardCreator {
    constructor(eventChannel, toaster, audioPlayer, abIcons, captionUtils, token) {
        this.eventChannel = eventChannel;
        this.toaster = toaster;
        this.audioPlayer = audioPlayer;
        this.abIcons = abIcons;
        this.captionUtils = captionUtils;
        this.isRunning = false;
        this.token = token;
    }

    addCard(captionId) {
        if (this.isRunning)
            return;
        var captionElement = document.getElementById(captionId);
        const videoElement = document.getElementById('ab-video-element');
        const currentTime = videoElement ? videoElement.currentTime : 0;
        const metaData = document.getElementById('ab-meta-data');
        const audioTrack = metaData ? metaData.getAttribute('data-audio-track') : 0;
        const [startNode, endNode, lines] = this.findRangeAndText(captionElement);
        this.recordCard(startNode, endNode, lines, captionId, currentTime, audioTrack);
    }

    findSelectionRange(selection) {
        if (!selection || !selection.toString())
            return null;

        const [startNode, endNode] = this.captionUtils.getStartEnd(selection);
        if (!startNode || !endNode)
            return null;

        const isTimeNode = n => n && n.hasAttribute && n.hasAttribute("data-start") && n.hasAttribute("data-end");
        const parentStart = this.captionUtils.findParentMatchingCondition(startNode.parentElement, isTimeNode);
        const parentEnd = this.captionUtils.findParentMatchingCondition(endNode.parentElement, isTimeNode);

        if (!parentStart || !parentEnd)
            return null;

        return [parentStart, parentEnd];
    }

    findRangeAndText(clickedCaption) {
        const selection = window.getSelection();
        const selectionRange = this.findSelectionRange(selection);
        if (!selectionRange)
            return [clickedCaption, clickedCaption, [clickedCaption.innerText]];

        var subtitleLines = [selection.toString()];
        try {
            const splitLines = this.captionUtils.getSelectionTextSplitByCaption(selection);
            if (splitLines.length > 0)
                subtitleLines = splitLines;
        }
        catch (e) {
            console.error(e.message);
        }

        return [...selectionRange, subtitleLines];
    }

    cleanLines(lines) {
        return lines.map(line => line.split("\n").map(singleLine => singleLine.trim()).filter(line => line).join("\n"));
    }

    recordCard(startElement, endElement, lines, captionId, currentVideoTime, audioTrack) {
        lines = this.cleanLines(lines);
        const startTime = startElement.getAttribute("data-start");
        const endTime = endElement.getAttribute("data-end");
        const message = {
            action: 'record', 
            lines: lines, 
            start: Number.parseFloat(startTime), 
            end: Number.parseFloat(endTime),
            currentVideoTime: currentVideoTime,
            audioTrack: audioTrack,
            token: this.token
        };

        this.abIcons.setSpinner(captionId);
        this.abIcons.disableAll();
        this.isRunning = true;
        try {
            this.eventChannel.sendMessage(message, event => {
                const response = event.data;
                this.isRunning = false;
                this.abIcons.reEnableAll();
                if (!response || !response.type) {
                    this.toaster.addError({ message: 'Failed to record flashcard. The Animebook extension may not be fully loaded yet.', isUserFacing: true })
                    this.abIcons.setAlert(captionId);
                } else if (response.type === 'card-created') {
                    this.toaster.setCard(response);
                    this.abIcons.setSuccess(captionId);
                    this.audioPlayer.playAudio(response.audioList)
                } 
                else {
                    this.toaster.addError(response);
                    this.abIcons.setAlert(captionId);
                } 
            })
        } catch (e) {
            this.isRunning = false;
            this.abIcons.reEnableAll();
            this.toaster.addError({ message: 'Failed to connect to extension: ' + e.message, isUserFacing: true })
            this.abIcons.setAlert(captionId);
        }
    }

}