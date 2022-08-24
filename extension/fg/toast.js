/* 
Pure JS that generates a bunch of HTML for showing notifications 
in the corner of the video player. Normally I'd use Vue for this,
but Manifest V3 for extensions doesn't like Vue using unsafe-eval.
You can get around that by creating an npm project and compiling
the Vue apps instead which eliminates the unsafe-eval, but that seemed 
overkill for these nofications, so this is the compromise I landed at.
*/
class Toaster {
    constructor() {
        this.errors = [];
        this.card = null;
        this.cardTimeout = null;
        this.cardOpacity = 1;
        this.errors = [];
        this.currentErrorIndex = 0;

        this.hook = document.getElementById("ab-extension-popup-wrapper");
        this.abToasts = this.div('ab-toasts');
        this.hook.replaceChildren(this.abToasts);

        this.abCard = this.div('ab-card', null, ['fade-in-out', 'unselectable']);

        this.abCardMessage = this.div('ab-card-message');
        this.abCardScreenshot = this.div('ab-card-screenshot');
        this.abCardSentence = this.div('ab-card-sentence');

        this.abCard.replaceChildren(this.abCardMessage, this.abCardScreenshot, this.abCardSentence);


        this.abError = this.div('ab-error', null, ['fade-in']);

        this.abErrorMessage = this.div('ab-error-message');
        this.abErrorText = this.div('ab-error-text');
        this.abErrorClose = this.div('ab-error-close', null, ['clickable']);
        this.abErrorClose.innerHTML = '&times;';
        this.abErrorClose.addEventListener('click', e => {
            this.errors = [];
            this.currentErrorIndex = 0;
            this.render()
        });
        this.abErrorMessage.replaceChildren(this.div('ab-error-alert', this.text('!')), this.abErrorText, this.abErrorClose);

        this.abStackTrace = this.el('textarea', 'ab-stack-trace');

        this.abErrorNavigation = this.div('ab-error-navigation');
        this.abErrorIncrement = this.div('ab-error-increment', null, ['arrow', 'arrow-right']);
        this.abErrorIncrement.addEventListener('click', e => {
            this.currentErrorIndex += 1;
            this.currentErrorIndex = this.currentErrorIndex % this.errors.length;
            this.render();
        });
        this.abErrorDecrement = this.div('ab-error-decrement', null, ['arrow', 'arrow-left']);
        this.abErrorDecrement.addEventListener('click', e => {
            this.currentErrorIndex -= 1;
            if (this.currentErrorIndex < 0)
                this.currentErrorIndex = this.errors.length - 1;

            this.render();
        });
        this.abErrorIndex = this.div('ab-error-index');

        this.abErrorNavigation.replaceChildren(this.abErrorIncrement, this.abErrorDecrement, this.abErrorIndex);
        this.abError.replaceChildren(this.abErrorMessage, this.abStackTrace, this.abErrorNavigation);
    }

    render() {
        let children = [];
        if (this.errors.length > 0) {
            children.push(this.abError);
            let err = this.currentError();
            this.abErrorText.replaceChildren(this.text(err.message));

            let errorChildren = []
            errorChildren.push(this.abErrorMessage);
            if (!err.isUserFacing) {
                errorChildren.push(this.abStackTrace);
                this.abStackTrace.replaceChildren(this.text(err.stack));
            }
            if (this.errors.length > 1) {
                errorChildren.push(this.abErrorNavigation);
                this.abErrorIndex.replaceChildren(this.text((this.currentErrorIndex + 1) + "/" + this.errors.length));
            }

            this.abError.replaceChildren(...errorChildren);
        }

        if (this.card) {
            children.push(this.abCard);
            this.abCardMessage.replaceChildren(this.card.message);
            let img = this.el('img');
            img.src = this.imgSrc();
            this.abCardScreenshot.replaceChildren(img);
            this.abCardSentence.replaceChildren(this.card.sentence);
        }

        if (this.allNodesEqual(children, this.abToasts.childNodes))
            return;
        this.abToasts.replaceChildren(...children);
    }

    allNodesEqual(a, b) {
        return a.length === b.length && a.every((elem, i) => elem == b[i]);
    }

    div(id, child, classes) {
        return this.el('div', id, child, classes);
    }

    text(s) {
        return document.createTextNode(s);
    }

    el(elemName, id, child, classes) {
        let el = document.createElement(elemName);
        el.id = id;
        if (child)
            el.replaceChildren(child);
        if (classes)
            for (let c of classes)
                el.classList.add(c);
        return el;
    }

    currentError() {
        return this.errors[this.currentErrorIndex];
    }

    imgSrc() {
        if (!this.card || !this.card.image)
            return '';
        return `data:image/${this.card.imageFormat};base64,${this.card.image}`
    }

    addError(error) {
        this.errors.push(error);
        this.currentErrorIndex = this.errors.length - 1;
        this.render();
    }

    setCard(card) {
        this.card = card;
        this.cardOpacity = 1;
        if (this.cardTimeout)
            clearTimeout(this.cardTimeoutToRemove);
        this.cardTimeout = setTimeout(() => {
            this.card = null;
            this.render();
        }, 1500);
        this.render();
    }
}