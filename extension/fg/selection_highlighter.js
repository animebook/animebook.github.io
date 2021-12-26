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
                el.classList.remove('first');
                el.classList.remove('last');
                el.classList.remove('disabled');
                el.classList.remove('highlight');
                el.classList.remove('please-click');
                el.classList.remove('hidden');
            });
            return;
        }

        Array.from(captions).forEach(el => {
            const elementId = this.getCaptionId(el)
            const selected = ids.indexOf(elementId) !== -1
            const firstSelected = ids[0] === elementId;
            const lastSelected = ids[ids.length - 1] == elementId
            const shouldDisable = !firstSelected;
            const shouldHide = ids.length > 1 && ids.indexOf(elementId) > 0;

            if (selected) 
                el.classList.add('highlight');
            else
                el.classList.remove('highlight');

            if (firstSelected && ids.length > 1)
                el.classList.add('first');
            else
                el.classList.remove('first');

            if (lastSelected && ids.length > 1)
                el.classList.add('last');
            else
                el.classList.remove('last');

            if (shouldDisable) {
                el.classList.add('disabled');
                el.classList.remove('please-click');
            }
            else {
                el.classList.remove('disabled');
                el.classList.add('please-click');
            }

            if (shouldHide)
                el.classList.add('hidden');
            else
                el.classList.remove('hidden');
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