class TemplateCompiler {
    constructor(settings) {
        this.settings = settings;
    }

    compileTemplate(expressionLookup, fieldTemplate) {
        var template = fieldTemplate.value;
        for (var key in expressionLookup) {
            var splitTemplate = template.split("{" + key + "}");
            var compiledTemplate = []
            for (var i = 0; i < splitTemplate.length - 1; i++) {
                compiledTemplate.push(splitTemplate[i]);
                compiledTemplate.push(expressionLookup[key]);
            }
            compiledTemplate.push(splitTemplate[splitTemplate.length - 1])
            template = compiledTemplate.join('');
        }
        return template;
    }

    createFieldMap(expressionLookup, latestNote) {
        var fieldMap = {}
        this.settings.ankiFieldTemplates.forEach(fieldTemplate => {
            if (fieldTemplate.value.length > 0) {
                var newContent = this.compileTemplate(expressionLookup, fieldTemplate);
                if (!newContent)
                    return;
                var existingContent = latestNote.fields[fieldTemplate.field].value;
                if (fieldTemplate.behavior === 'replace')
                    fieldMap[fieldTemplate.field] = newContent;
                else if (fieldTemplate.behavior === 'insertIfEmpty' && existingContent.length === 0)
                    fieldMap[fieldTemplate.field] = newContent;
                else if (fieldTemplate.behavior === 'append')
                    fieldMap[fieldTemplate.field] = existingContent + newContent;
                else if (fieldTemplate.behavior === 'prepend')
                    fieldMap[fieldTemplate.field] = newContent + existingContent;
            }
        })
        return fieldMap;
    }
    
    findNeededExpressions(latestNote) {
        var uniqueExpressions = new Set();
        this.settings.ankiFieldTemplates.forEach(fieldTemplate => {
            if (fieldTemplate.behavior === 'insertIfEmpty' && latestNote.fields[fieldTemplate.field].value.length > 0)
                return;

            AB_TEMPLATE_EXPRESSIONS.forEach(expr => {
                if (fieldTemplate.value.indexOf("{" + expr + "}") !== -1)
                    uniqueExpressions.add(expr)
            })
        })
        return uniqueExpressions;
    }

}