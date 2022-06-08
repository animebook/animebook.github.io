new Vue({
    el: "#app",
    data: {
        settings: {},
        availableDecks: [],
        availableModels: [],
        ankiLoadError: null
    },
    created: function () {
        var self = this;
        AB_GET_SETTINGS().then(settings => {
            Vue.set(self, 'settings', settings);
            try {
                this.loadAnkiData();
            } catch (e) {
                this.ankiLoadError = e.message;
            }
        });
    },
    mounted: function () {
        $('[data-toggle="tooltip"]').tooltip()
    },
    computed: {
        ankiModel: function () {
            return this.settings.ankiModel;
        },
        audioCommand: function () {
            const command = new FFmpegCommands(this.settings).createAudioFFmpegCommand("input.mp4", 10, 15, 0);
            return "ffmpeg " + command.commandArgs.join(' ');
        },
        imageCommand: function () {
            const command = new FFmpegCommands(this.settings).createImageFFmpegCommand("input.mp4", 10, 0, 20);
            return "ffmpeg " + command.commandArgs.join(' ');
        },
        notFilledOut: function () {
            var arr = [];
            if (this.ankiLoadError)
                return [];

            if (!this.settings.ankiDeck) {
                arr.push("Select a Deck")
            }

            if (!this.settings.ankiModel) {
                arr.push("Select a Model")
            }

            return arr;
        },
        availableTemplateExpressions: function () {
            return AB_TEMPLATE_EXPRESSIONS;
        }
    },
    watch: {
        settings: {
            handler: function (newValue, oldValue) {
                var cleanSettings = JSON.parse(JSON.stringify(newValue));
                chrome.storage.local.set({'settings': cleanSettings}, function () {});
            },
            deep: true
        },
        ankiModel: function (newValue, oldValue) {
            this.updateAnkiFieldNames(newValue);
        }
    },
    methods: {
        loadAnkiData: async function () {
            var anki = new AnkiConnect(this.settings);
            var deckObj = await anki.getDeckNames();
            this.availableDecks = deckObj.result.sort((a, b) => a.localeCompare(b));
            var modelObj = await anki.getModelNames();
            this.availableModels = modelObj.result.sort((a, b) => a.localeCompare(b));
        },
        updateAnkiFieldNames: async function (newModel) {
            try {
                var newFieldNames = [];
                if (newModel) {
                    var obj = await new AnkiConnect(this.settings).getModelFieldNames(newModel);
                    newFieldNames = obj.result;
                }
                var oldFieldNames = this.settings.ankiFieldTemplates.map(template => template.field);
                if (JSON.stringify(newFieldNames) === JSON.stringify(oldFieldNames))
                    return;

                this.settings.ankiFieldTemplates.splice(0, this.settings.ankiFieldTemplates.length);
                newFieldNames.forEach(fieldName => {
                    this.settings.ankiFieldTemplates.push({
                        "field": fieldName,
                        "value": "",
                        "behavior": "replace"
                    });
                });
            } catch (e) {
                this.ankiLoadError = e.message;
            }
        },
        restoreDefaults: function () {
            Vue.set(this, 'settings', AB_DEFAULT_OPTIONS);
        },
        addExpressionToTemplate: function (expression, template) {
            template.value = "{" + expression + "}";
        },
        addSentenceReplacement: function () {
            this.settings.sentenceReplacements.push({regex: "", replaceText: ""});
        },
        removeSentenceReplacement: function (index) {
            this.settings.sentenceReplacements.splice(index, 1);
        },
        onImportSettings: function (e) {

            var reader = new FileReader();
            reader.readAsText(e.target.files[0]);
            reader.onload = e => {
                var json = JSON.parse(reader.result);
                this.settings = AB_SANITIZE_SETTINGS(json);
            };
            document.getElementById('settings-import-hidden').value = null;
        },
        onExportSettings: function (e) {
            var settingsStr = JSON.stringify(this.settings, null, 2);
            var timeStr = new TimeFormatter().createDateTimeString();
            this.downloadString(settingsStr, 'json', 'animebook-settings-' + timeStr + '.json');
        },
        downloadString: function (text, fileType, fileName) {
            var blob = new Blob([text], { type: fileType });
            var a = document.createElement('a');
            a.download = fileName;
            a.target="_blank";
            a.href = URL.createObjectURL(blob);
            a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() { URL.revokeObjectURL(a.href); }, 1500);
        }
    }
});