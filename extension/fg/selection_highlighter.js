class SelectionHighlighter {
    constructor(captionUtils) {
        this.captionUtils = captionUtils;
    }

    getCaptionId(element) {
        return parseInt(element.getAttribute('data-caption-id').replace('id_', ''));
    }
    
    updateHighlightedCaptions(ids) {
        const captions = document.getElementsByClassName('anki-export');
        if (ids.length === 0) {
            Array.from(captions).forEach(el => {
                el.classList.remove('disabled');
                el.classList.remove('highlight');
                el.classList.remove('please-click');
            });
            return;
        }

        Array.from(captions).forEach(el => {
            const elementId = this.getCaptionId(el)
            const shouldHighlight = ids.indexOf(elementId) !== -1
            const shouldDisable = ids[0] !== elementId;

            if (shouldHighlight) 
                el.classList.add('highlight');
            else
                el.classList.remove('highlight');

            if (shouldDisable) {
                el.classList.add('disabled');
                el.classList.remove('please-click');
            }
            else {
                el.classList.remove('disabled');
                el.classList.add('please-click');
            }
                
        })
    }

    onSelectionChange () {
        const selection = window.getSelection();
        if (!selection || !selection.toString()) {
            this.updateHighlightedCaptions([]);
            return;
        }

        const [start, end] = this.captionUtils.getStartEnd(selection);
        if (!start || !end) {
            this.updateHighlightedCaptions([]);
            return;
        }

        const isIdNode = n => n && n.hasAttribute && n.hasAttribute("data-caption-id");
        const parentStart = this.captionUtils.findParentMatchingCondition(start.parentElement, isIdNode);
        const parentEnd = this.captionUtils.findParentMatchingCondition(end.parentElement, isIdNode);
        if (!parentStart || !parentEnd) {
            this.updateHighlightedCaptions([]);
            return;
        }

        const startId = this.getCaptionId(parentStart);
        const endId = this.getCaptionId(parentEnd);

        var ids = [];
        for (var i = startId; i <= endId; i++) {
            ids.push(i);
        }

        this.updateHighlightedCaptions(ids);
    }
}