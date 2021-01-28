const CREATE_TOAST_VUE_INSTANCE = () => new Vue({
    el: "#ab-extension-popup-wrapper",
    template: `
    <div id="ab-toasts">
        <div v-if="errors.length > 0" id="ab-error" class="fade-in">
            <div id="ab-error-message">
                <div id="ab-error-alert">!</div>
                <div id="ab-error-text">{{currentError.message}}</div>
                <div @click="removeErrors" id="ab-error-close" class="clickable">&times;</div>
            </div>
            <textarea v-if="!currentError.isUserFacing" id="ab-stack-trace">{{currentError.stack}}</textarea>
            <div v-if="errors.length > 1" id="ab-error-navigation">
                <div @click="incrementError()" id="ab-error-increment" class="arrow arrow-right"></div>
                <div @click="decrementError()" id="ab-error-decrement" class="arrow arrow-left"></div>
                <div id="ab-error-index">{{currentErrorIndex + 1}}/{{errors.length}}</div>
            </div>
        </div>
        <div v-if="card" id="ab-card" class="fade-in-out unselectable" :style="">
            <div id="ab-card-message">{{card.message}}</div>
            <div id="ab-card-screenshot"><img :src="imgSrc"></img></div>
            <div id="ab-card-sentence">{{card.sentence}}</div>
        </div>
    </div>
    `,
    data: {
        card: null,
        cardTimeout: null,
        cardOpacity: 1,
        errors: [],
        currentErrorIndex: 0
    },
    created: function () {
        this.$on('add-error', this.addError);
        this.$on('set-card', this.setCard);
    },
    mounted: function () {
    },
    computed: {
        currentError: function () {
            return this.errors[this.currentErrorIndex];
        },
        imgSrc: function () {
            if (!this.card || !this.card.image)
                return '';
            return `data:image/${this.card.imageFormat};base64,${this.card.image}`
        }
    },
    watch: {
    },
    methods: {
        addError: function (error) {
            this.errors.push(error);
            this.currentErrorIndex = this.errors.length - 1;
        },
        removeErrors: function () {
            this.errors = [];
            this.currentErrorIndex = 0;
        },
        setCard: function (card) {
            this.card = card;
            this.cardOpacity = 1;
            if (this.cardTimeout)
                clearTimeout(this.cardTimeoutToRemove);
            this.cardTimeout = setTimeout(() => {
                this.card = null;
            }, 1500);

        },
        incrementError: function () {
            this.currentErrorIndex += 1;
            this.currentErrorIndex = this.currentErrorIndex % this.errors.length;
        },
        decrementError: function () {
            this.currentErrorIndex -= 1;
            if (this.currentErrorIndex < 0)
                this.currentErrorIndex = this.errors.length - 1;
        }
    }
});