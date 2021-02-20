class SentenceFormatter {
    constructor(settings) {
        this.settings = settings;
    }

    updateLines(lines) {
        lines = this.applyRegexReplacements(lines);
        const text = this.applyNewlineReplacements(lines);
        return [lines.join('\n'), text];
    }
    
    createUserRegex(inputRegex) {
        return new RegExp(inputRegex, "g");
    }

    applyRegexReplacements(lines) {
        this.settings.sentenceReplacements.forEach(replacement => {
            if (replacement.regex.length > 0) {
                const reg = this.createUserRegex(replacement.regex)
                lines = lines.map(text => text.replace(reg, replacement.replaceText));
            }
        });
        return lines;
    }

    removeNewlines(text) {
        return text.replace(/\r/g, '').replace(/\n+/g, '');
    }

    splitOnNewlines(text) {
        return text.replace(/\r/g, '').split(/\n+/g);
    }

    wrapInDiv(text) {
        return "<div>" + text + "</div>";
    }

    applyNewlineReplacements(lines) {
        var text = lines.join('\n');
        if (this.settings.newlineBehavior === 'divs') {
            text = this.splitOnNewlines(text).map(this.wrapInDiv).join('\n');
        } else if (this.settings.newlineBehavior === 'remove') {
            text = this.removeNewlines(text);
        } else if (this.settings.newlineBehavior === 'subtitleSplit') {
            text = lines.map(this.removeNewlines).map(this.wrapInDiv).join('\n')
        }
        return text;
    }
}