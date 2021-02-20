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

    nextNode(node) {
        if (node.hasChildNodes()) {
            return node.firstChild;
        } else {
            while (node && !node.nextSibling) {
                node = node.parentNode;
            }
            if (!node) {
                return null;
            }
            return node.nextSibling;
        }
    }

    findIdOfNode(node) {
        if (!node || !node.parentNode || !node.parentNode.parentNode)
            return null;

        const parent = node.parentNode;
        const grandParent = parent.parentNode;

        if (!parent.tagName || parent.tagName !== 'P')
            return null;

        if (!grandParent.hasAttribute || !grandParent.hasAttribute('data-caption-id'))
            return null;

        return grandParent.getAttribute('data-caption-id');
    }

    getSelectionTextSplitByCaption(selection) {
        if (selection.rangeCount === 0)
            return [];
        const range = selection.getRangeAt(0);
        var startNode = range.startContainer;
        var endNode = range.endContainer;
    
        if (startNode == endNode) {
            return [selection.toString()];
        }
    
        var rangeNodes = [];
        const firstNodeId = this.findIdOfNode(startNode);
        if (firstNodeId)
            rangeNodes.push({id: firstNodeId, text: startNode.data.substring(range.startOffset)});

        var node = this.nextNode(startNode);
        while (node && node != endNode) {
            const id = this.findIdOfNode(node);
            if (id)
                rangeNodes.push({id: id, text: node.data});
            node = this.nextNode(node)
        }

        const endNodeId = this.findIdOfNode(endNode);
        if (endNodeId)
            rangeNodes.push({id: endNodeId, text: endNode.data.substring(0, range.endOffset)})

        const combinedNodes = rangeNodes.reduce((lines, rangeNode) => {
            if (lines.length === 0 || lines[lines.length - 1].id !== rangeNode.id)
                lines.push(rangeNode);
            else
                lines[lines.length - 1].text = lines[lines.length - 1].text + '\n' + rangeNode.text;
            return lines;
        }, []);
    
        return combinedNodes.map(n => n.text);
    }
        
}