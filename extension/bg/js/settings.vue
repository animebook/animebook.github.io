<template>
<div v-cloak class="container">
<div class="ab-form-section mb-3 mt-5">
    <h1>Animebook Anki Export</h1>
    <div class="tutorial">
        <div class="tutorial-text">
            <h5>Quick start</h5>
            <ol>
                <li>In the settings below, choose what Anki deck you're using and how you want your cards to look</li>
                <li>Add a word to Anki using Yomichan</li>
                <li>On animebook, <b>select and highlight</b> the subtitle text you want on your card</li>
                <li>Hit the plus button on the animebook sidebar (keyboard shortcut: <span class="mono-text">e</span>)</li>
                <li>Wait for your Anki card to be updated with a screenshot, audio, and text</li>
            </ol>
        </div>
        <video class="tutorial-video" controls width="320" height="192" muted>
            <source src="resources/maoujou_de_oyasumi.webm" type="video/webm">
        </video>
    </div>

    <p>For this extension to work, you must have Anki downloaded and the anki-connect plugin installed.</p>
    <p>Download Anki: <a href="https://apps.ankiweb.net/" target="_blank" rel="noopener">https://apps.ankiweb.net/</a></p>
    <p>Download AnkiConnect: <a href="https://foosoft.net/projects/anki-connect/" target="_blank" rel="noopener">https://foosoft.net/projects/anki-connect/</a></p>

</div>

<div v-if="ankiLoadError" class="alert alert-danger" role="alert">
    {{ankiLoadError}}
</div>

<div v-if="notFilledOut.length !== 0" class="alert alert-warning" role="alert">
    Todo to setup anki export:
    <li v-for="warning in notFilledOut">{{warning}}</li>
    Then, you can fill out what content should go in what field for your cards.
</div>

<div class="ab-form-section mb-3" id="anki-fields-container">
    <div class="row">
        <div class="form-group col-5">
            <label for="anki-terms-deck">Deck</label>
            <select v-model="settings.ankiDeck" class="form-control" id="anki-terms-deck">
                <option v-for="deck in availableDecks" :value="deck">{{deck}}</option>
            </select>
        </div>

        <div class="form-group col-5">
            <label for="anki-terms-model">Model</label>
            <select v-model="settings.ankiModel" class="form-control" id="anki-terms-model">
                <option v-for="model in availableModels" :value="model">{{model}}</option>
            </select>
        </div>

        <div class="form-group col-2">
            <label for="anki-expression-field">
                Vocab Field
                <span class="tiny-tip" data-toggle="tooltip" data-placement="top" title="The field that contains the vocab you're trying to learn. This is used for Forvo audio lookups">?</span>
            </label>
            <select :disabled="!settings.ankiFieldTemplates || settings.ankiFieldTemplates.length === 0" v-model="settings.ankiVocabField" class="form-control" id="anki-expression-field">
                <option value=""></option>
                <option v-for="template in settings.ankiFieldTemplates" :value="template.field">{{template.field}}</option>
            </select>
        </div>
    </div>

    <table class="table table-bordered">
        <thead>
            <tr>
                <th>Field</th>
                <th>Content to put in field</th>
                <th class="handle-existing-text-column">When field already has content</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="template in settings.ankiFieldTemplates">
                <td>{{template.field}}</td>
                <td>
                    <div class="input-group">
                        <input type="text" class="form-control" v-model="template.value">
                        <div class="dropdown">
                            <button class="btn btn-light dropdown-toggle" type="button" id="template-options-dropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            </button>
                            <div class="dropdown-menu" aria-labelledby="template-options-dropdown">
                                <button v-for="expression in availableTemplateExpressions" :disabled="expression === 'forvo-word-audio' && !settings.ankiVocabField" class="dropdown-item" type="button" @click="addExpressionToTemplate(expression, template)">
                                    {{expression}}{{(expression === 'forvo-word-audio' && !settings.ankiVocabField) ? ' (no Vocab Field found)' : ''}}
                                </button>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="handle-existing-text-column">
                    <select :disabled="template.value.length === 0" class="form-control" v-model="template.behavior">
                        <option value="replace">Replace existing content</option>
                        <option value="insertIfEmpty">Only insert if already empty</option>
                        <option value="prepend">Prepend to start of content</option>
                        <option value="append">Append to end of content</option>
                    </select>
                </td>
            </tr>
        </tbody>
    </table>

</div>

<div class="ab-form-section mb-3 thin-form">
    <h4>Sentence Text</h4>
    <div class="form-group row">
        <div class="col-4 my-auto">What to do with newlines</div>
        <select class="form-control col-8" v-model="settings.newlineBehavior">
            <option value="divs">Convert to &lt;div&gt; elements</option>
            <option value="subtitleSplit">Remove newlines inside captions, but convert each caption to a &lt;div&gt;</option>
            <option value="remove">Remove entirely</option>
            <option value="leave">Leave as is</option>
        </select>
    </div>

    <h4>Regex Replacements</h4>
    <p>
        At flashcard creation time, replace patterns in the sentence text before inserting it into your flashcard.
        For example, replacing <span class="mono-text">(（.*?）|\(.*?\))</span> with empty text will
        remove anything in parentheses.
    </p>
    <table class="table table-bordered">
        <thead>
            <tr>
                <th>Regex</th>
                <th>Replacement Text</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(replacement, index) in settings.sentenceReplacements">
                <td>
                    <input type="text" class="form-control" v-model="replacement.regex">
                </td>
                <td>
                    <input type="text" class="form-control" v-model="replacement.replaceText">
                </td>
                <td>
                    <button @click="removeSentenceReplacement(index)" class="btn btn-danger">Delete</button>
                </td>
            </tr>
        </tbody>
    </table>
    <button @click="addSentenceReplacement()" class="btn btn-success">+ Add replacement</button>
</div>

<div class="ab-form-section mb-3 thin-form">
    <h4>Screenshots</h4>
    <div class="row mb-2">
        <div class="col-7 my-auto">Resizing</div>
        <select class="form-control col-5" v-model="settings.imageResizeSelection">
            <option value="height">Resize to specific height</option>
            <option value="width">Resize to specific width</option>
            <option value="none">Do not resize</option>
        </select>
    </div>

    <div class='resize-settings'>
        <div v-if="settings.imageResizeSelection == 'height'" class="form-group row">
            <label class="col-7 my-auto" for="image-resize-height">Height to resize to (px)</label>
            <input class="col-5 form-control" v-model.number="settings.imageResizeHeight" type="number" id="image-resize-height" >
        </div>

        <div v-if="settings.imageResizeSelection == 'width'" class="form-group row">
            <label class="col-7 my-auto" for="image-resize-width">Width to resize to (px)</label>
            <input class="col-5 form-control" v-model.number="settings.imageResizeWidth" type="number" id="image-resize-width" >
        </div>
    </div>

    <div class="form-group row">
        <div class="col-7 my-auto">Screenshot format</div>
        <select class="form-control col-5" v-model="settings.imageFormat">
            <option value="png">PNG</option>
            <option value="jpg">JPEG</option>
            <option value="gif">GIF</option>
        </select>
    </div>

    <div v-if="settings.imageFormat !== 'gif'" class="form-group row">
        <div class="col-5 my-auto">Take screenshots at the</div>
        <select class="form-control col-7" v-model="settings.imageTiming">
            <option value="middle">Time point in the middle of the selected captions</option>
            <option value="currentFrame">Current frame the video's playing at</option>
        </select>
    </div>

    <div v-if="settings.imageFormat == 'gif'" class="form-group row">
        <label class="col-7 my-auto" for="frames-per-second">Frames per second</label>
        <input class="col-5 form-control" v-model.number="settings.gifFPS" id="frames-per-second" type="number" min="1" max="24">
    </div>

    <label for="image-ffmpeg-flags">Custom ffmpeg flags when taking screenshots:</label>
    <input class="form-control mb-1" v-model="settings.imageFfmpegFlags" type="text" id="image-ffmpeg-flags">

    <label>Preview:</label>
    <div class="ffmpeg-command">
        {{imageCommand}}
    </div>
</div>

<div class="ab-form-section mb-3 thin-form">
    <h4>Forvo Audio</h4>
    <div class="form-group row">
        <label class="col-7 my-auto" for="forvo-audio-multiplier">Multiply volume of forvo audio by</label>
        <input class="col-5 form-control" step= "0.1" v-model.number="settings.forvoAudioVolumeMultiplier" type="number" id="forvo-audio-multiplier" >
    </div>

    <div class="form-group row">
        <div class="col-7 my-auto">Autoplay forvo word audio found after recording card?</div>
        <select class="form-control col-5" v-model="settings.forvoAudioPlayback">
            <option value="autoPlay">Yes</option>
            <option value="none">No</option>
        </select>
    </div>
</div>

<div class="ab-form-section mb-3 thin-form">
    <h4>Recorded Audio</h4>
    <div class="form-group row">
        <label class="col-7 my-auto" for="audio-multiplier">Multiply volume of recorded audio by</label>
        <input class="col-5 form-control" step= "0.1" v-model.number="settings.audioVolumeMultiplier" type="number" id="audio-multiplier" >
    </div>

    <div class="form-group row">
        <label class="col-7 my-auto" for="audio-clip-padding">Expand start and end of recorded audio by (seconds)</label>
        <input class="col-5 form-control" step="0.1" v-model.number="settings.audioClipPadding" type="number" id="audio-clip-padding" >
    </div>

    <div class="form-group row">
        <label class="col-7 my-auto" for="audio-clip-fade">Fade start and end of recorded audio by (seconds)</label>
        <input class="col-5 form-control" step="0.1" v-model.number="settings.audioClipFade" type="number" id="audio-clip-fade" >
    </div>

    <div class="form-group row">
        <div class="col-7 my-auto">Autoplay sentence audio after recording card?</div>
        <select class="form-control col-5" v-model="settings.audioPlayback">
            <option value="autoPlay">Yes</option>
            <option value="none">No</option>
        </select>
    </div>

    <label class="" for="audio-ffmpeg-flags">Custom ffmpeg flags when recording audio:</label>
    <input class="form-control" v-model="settings.audioFfmpegFlags" type="text" id="audio-ffmpeg-flags">

    <label>Preview:</label>
    <div class="ffmpeg-command">
        {{audioCommand}}
    </div>
</div>

<div class="ab-form-section mb-3 thin-form">
    <h4>Other</h4>
    <div class="form-group row">
        <label class="col-7 my-auto" for="anki-server">Anki server address</label>
        <input class="col-5 form-control" v-model="settings.ankiServer" type="text" id="anki-server" >
    </div>
    <div class="form-group row">
        <div class="col-7 my-auto">What to show in Anki browser after upload?</div>
        <select class="form-control col-5" v-model="settings.ankiBrowserFinalDisplay">
            <option value="currentDeck">Cards from updated Anki deck</option>
            <option value="customQuery">Custom browser query</option>
            <option value="none">Do not update Anki browser</option>
        </select>

    </div>
    <div class="anki-query-settings">
        <div class="alert alert-warning anki-no-update-warning" v-if="settings.ankiBrowserFinalDisplay === 'none'">
            <div class="tiny-warning">!</div> 
            <div>
                By choosing <span class="mono-text">Do not update Anki browser</span>, Animebook will silently fail to update your Anki cards if you have them selected in the Anki browser. 
                To prevent this from happening, keep your most recently added card deselected while creating Anki cards.
            </div>
        </div>
        <div v-if="settings.ankiBrowserFinalDisplay === 'customQuery'" class="form-group row">
            <label class="col-7 my-auto" for="anki-custom-query">Custom query</label>
            <input class="col-5 form-control" v-model.number="settings.ankiBrowserFinalQuery" id="anki-custom-query" >
        </div>
    </div>
</div>

<div class="ab-form-section thin-form">
    <h4>Backup</h4>
    <p class="help-block">
        If you need a backup of your Animebook export settings, you can download them as json here:
    </p>
    <div>
        <button class="btn btn-info" id="settings-export" @click="onExportSettings">Export Settings</button>
        <input type="file" id="settings-import-hidden" class="hidden" @change="onImportSettings" name="files" />
        <label class="btn btn-info margin-zero" for="settings-import-hidden" id="settings-import">
            Import Settings
        </label>
        <button class="btn btn-danger" id="settings-reset" @click="" data-toggle="modal" data-target="#reset-modal">Reset Default Settings</button>

        <div id="reset-modal" class="modal fade" role="dialog">
            <div class="modal-dialog modal-dialog-centered">
                <!-- Modal content-->
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Reset to Default Settings?</h4>
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="reset-warning">You are about to reset all Animebook settings back to their default values. <b>This action cannot be undone.</b></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" data-dismiss="modal" @click="restoreDefaults()">Reset to Defaults</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="pull-right bottom-links mt-3">
    <small>
        &bull; <a target="_blank" href="https://github.com/animebook/animebook.github.io">Github</a>
    </small>
</div> 
</div>
</template>



<script>
import Vue from 'vue'
export default {
    data() {
        return {
            settings: {},
            availableDecks: [],
            availableModels: [],
            ankiLoadError: null
        };
    },
    created: function () {
        var self = this;
        AB_GET_SETTINGS().then((settings) => {
            // for (key in settings)
            //     this.settings[key] = settings[key]
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
}
</script>