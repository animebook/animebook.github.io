class CardCreator {
    constructor(toaster, abIcons, captionUtils) {
        this.toaster = toaster;
        this.abIcons = abIcons;
        this.captionUtils = captionUtils;
    }

    addCard(captionId) {
        var captionElement = document.getElementById(captionId);
        var captionText = captionElement.textContent;
        const selection = window.getSelection();
        const videoElement = document.getElementById('ab-video-element');
        const currentTime = videoElement ? videoElement.currentTime : 0;
        const metaData = document.getElementById('ab-meta-data');
        const audioTrack = metaData ? metaData.getAttribute('data-audio-track') : 0;
        if (!selection || !selection.toString()) {
            this.recordCard(captionElement, captionElement, captionText, captionId, currentTime, audioTrack);
        }
        else {
            const [startNode, endNode] = this.captionUtils.getStartEnd(selection);
            if (!startNode || !endNode) {
                this.recordCard(captionElement, captionElement, captionText, captionId);
                return;
            }
            
            const isTimeNode = n => n && n.hasAttribute("data-start") && n.hasAttribute("data-end");
            const parentStart = this.captionUtils.findParentMatchingCondition(startNode.parentElement, isTimeNode);
            const parentEnd = this.captionUtils.findParentMatchingCondition(endNode.parentElement, isTimeNode);
    
            if (!parentStart || !parentEnd) {
                this.recordCard(captionElement, captionElement, captionText, captionId);
                return;
            }
    
            this.recordCard(parentStart, parentEnd, selection.toString(), captionId);
        }
    }

    recordCard(startElement, endElement, text, captionId, currentVideoTime, audioTrack) {
        text = text.split("\n").map(line => line.trim()).filter(line => line).join("\n");
        const startTime = startElement.getAttribute("data-start");
        const endTime = endElement.getAttribute("data-end");
        const message = {
            action: 'record', 
            text: text, 
            start: Number.parseFloat(startTime), 
            end: Number.parseFloat(endTime),
            currentVideoTime: currentVideoTime,
            audioTrack: audioTrack
        };
    
        this.abIcons.setSpinner(captionId);
        this.abIcons.disableAll();
        try {
            chrome.runtime.sendMessage(message, {}, response => {
                this.abIcons.reEnableAll();
                if (!response || !response.type) {
                    this.toaster.$emit('add-error', { message: 'Failed to record flashcard. The Animebook extension may not be fully loaded yet.', isUserFacing: true })
                    this.abIcons.setAlert(captionId);
                } else if (response.type === 'card-created') {
                    this.toaster.$emit('set-card', response);
                    this.abIcons.setSuccess(captionId);
                } 
                else {
                    this.toaster.$emit('add-error', response);
                    this.abIcons.setAlert(captionId);
                } 
            })
        } catch (e) {
            this.abIcons.reEnableAll();
            this.toaster.$emit('add-error', { message: 'Failed to connect to extension: ' + e.message, isUserFacing: true })
            this.abIcons.setAlert(captionId);
        }
    }

}