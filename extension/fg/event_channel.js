class EventChannel {
    constructor() {
        this.proxyFrame = null;
        this.proxyFrameReady = false;
        this.proxyFrameMessageQueue = [];
    }

    initializeIFrame(token) {
        this.sendMessage({action: 'token', token: token});
    }

    sendMessage(message, callback) {
        var channel = new MessageChannel();
        channel.port1.onmessage = callback;
        this.postMessageToFrame(message, [channel.port2])
    }

    postMessageToFrame (message, transferables) {
        this.proxyFrameMessageQueue.push([message, transferables]);

        if (!this.proxyFrame) {
            this.loadFrameAndFlush();
        } else if (this.proxyFrameReady) {
            this.flushMessages();
        }
    }

    loadFrameAndFlush() {
        this.proxyFrame = document.createElement('iframe');
        this.proxyFrame.id = 'background-animebook-iframe';
        this.proxyFrame.src = chrome.runtime.getURL('/bg/background.html');
        this.proxyFrame.onload = () => {
            this.proxyFrameReady = true;
            this.flushMessages()
        };
        (document.body || document.documentElement).appendChild(this.proxyFrame);
    }

    flushMessages() {
        const contentWindow = this.proxyFrame.contentWindow;
        this.proxyFrameMessageQueue.forEach(item => {
            const [message, transferables] = item;
            contentWindow.postMessage(message, '*', transferables);
        })
        this.proxyFrameMessageQueue = [];
    }

}