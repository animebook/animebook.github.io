let ab_resolves = {}
let ab_rejects = {}
let ab_globalMessageId = 0

class PromiseWorker {
    constructor(filename) {
        this.worker = new Worker(filename);
        this.worker.onmessage = this.handleMsg;
    }

    sendMessage(message) {
        return this.sendMsg(message, this.worker);
    }

    // Activate calculation in the worker, returning a promise
    sendMsg(payload, worker){
        const msgId = ab_globalMessageId++
        const msg = {
            id: msgId,
            ...payload
        }
        return new Promise((resolve, reject) => {
            // save callbacks for later
            ab_resolves[msgId] = resolve
            ab_rejects[msgId] = reject
            worker.postMessage(msg)
        })
    }

    // Handle incoming calculation result
    handleMsg(msg) {
        const {id, err, payload} = msg.data
        if (payload) {
            const resolve = ab_resolves[id]
            if (resolve) {
                resolve(payload)
            }
        } else {
            // error condition
            const reject = ab_rejects[id]
            if (reject) {
                if (err) {
                    reject(err)
                } else {
                    reject('Got nothing')
                }
            }
        }
        
        // purge used callbacks
        delete ab_resolves[id]
        delete ab_rejects[id]
    }
}