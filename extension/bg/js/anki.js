class AnkiConnect {
    constructor(settings) {
        this._settings = settings;
        this._server = settings.ankiServer;
        this._localVersion = 6;
        this._enabled = true;
    }

    async canAddNotes(notes) {
        return await this._invoke('canAddNotes', {notes: notes});
    }

    async updateNoteFields(note) {
        return await this._invoke('updateNoteFields', {note: note});
    }

    async getDeckNames() {
        return await this._invoke('deckNames');
    }

    async getModelNames() {
        return await this._invoke('modelNames');
    }

    async getModelFieldNames(modelName) {
        return await this._invoke('modelFieldNames', {modelName: modelName});
    }

    async storeMediaFile(fileName, dataBase64) {
        return await this._invoke('storeMediaFile', {filename: fileName, data: dataBase64});
    }

    async findRecentNoteIds() {
        return await this._invoke('findNotes', {query: `deck:${this._settings.ankiDeck} note:${this._settings.ankiModel} added:2`});
    }

    async findNoteInfoByIds(noteIds) {
        return await this._invoke('notesInfo', { notes: noteIds });
    }

    async showNoCardsInGui() {
        return await this._invoke('guiBrowse', {query: "deck:1 && deck:2"})
    }

    async showCurrentDeckInGui() {
        var deck = this._settings.ankiDeck || "current";
        return await this._invoke('guiBrowse', {query: "deck:" + deck})
    }

    async runCustomBrowserQuery(query) {
        return await this._invoke('guiBrowse', {query: query})
    }

    async showNoteInGui(noteId) {
        return await this._invoke('guiBrowse', {query: "nid:" + noteId})
    }

    async _invoke(action, params) {
        var result = null;
        try {
            const response = await fetch(this._server, {
                method: 'POST',
                mode: 'cors',
                cache: 'default',
                credentials: 'omit',
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify({action, params, version: this._localVersion})
            });
            result = await response.json();
        } catch (e) {
            throw new UserFacingError("Could not find Anki server. Please make sure Anki is running and AnkiConnect is installed.");
        }

        if (result && typeof result === 'object') {
            const error = result.error;
            if (error) {
                throw new UserFacingError(`AnkiConnect error: ${error}`);
            }
        }
        return result;
    }
}
