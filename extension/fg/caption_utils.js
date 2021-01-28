class CaptionUtils {


    findParentMatchingCondition(node, condition) {
        if (node === null)
            return null;
        if (condition(node))
            return node;
        return this.findParentMatchingCondition(node.parentNode, condition);
    }

    getStartEnd(selection) {
        if (selection.rangeCount === 0)
            return [null, null];
        const range = selection.getRangeAt(0);
        const startNode = range.startContainer;
        const endNode = range.endContainer;
        return [startNode, endNode];
    }
}