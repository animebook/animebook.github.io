class SentenceFormatter {
    constructor(settings) {
        this.settings = settings;
    }
    
    createUserRegex(inputRegex) {
        return new RegExp(inputRegex, "g");
    }

    applyRegexReplacements(text) {
        this.settings.sentenceReplacements.forEach(replacement => {
            if (replacement.regex.length > 0) {
                const reg = this.createUserRegex(replacement.regex)
                text = text.replace(reg, replacement.replaceText);
            }
        });
        return text;
    }

    applyNewlineReplacements(text) {
        if (this.settings.newlineBehavior === 'divs') {
            text = text.replace(/\r/g, '').split(/\n+/g).map(line => "<div>" + line + "</div>").join("\n");
        } else if (this.settings.newlineBehavior === 'remove') {
            text = text.replace(/\r/g, '').replace(/\n+/g, '');
        }
        return text;
    }
}