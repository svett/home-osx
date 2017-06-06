'use strict';
const xpath = require('xpath');
let DOMParser = require('xmldom').DOMParser;
class EvaluatorResult {
}
exports.EvaluatorResult = EvaluatorResult;
class EvaluatorResultType {
}
EvaluatorResultType.SCALAR_TYPE = 0;
EvaluatorResultType.NODE_COLLECTION = 1;
exports.EvaluatorResultType = EvaluatorResultType;
class XPathEvaluator {
    static evaluate(query, xml, ignoreDefaultNamespace) {
        if (ignoreDefaultNamespace) {
            xml = xml.replace(/xmlns=".+"/g, (match) => {
                return match.replace(/xmlns/g, 'xmlns:default');
            });
        }
        let nodes = new Array();
        let xdoc = new DOMParser().parseFromString(xml, 'text/xml');
        let resolver = xpath.createNSResolver(xdoc);
        let result = xpath.evaluate(query, xdoc, resolver, xpath.XPathResult.ANY_TYPE, null);
        let evalResult = new EvaluatorResult();
        evalResult.type = EvaluatorResultType.SCALAR_TYPE;
        switch (result.resultType) {
            case xpath.XPathResult.NUMBER_TYPE:
                evalResult.result = result.numberValue;
                break;
            case xpath.XPathResult.STRING_TYPE:
                evalResult.result = result.stringValue;
                break;
            case xpath.XPathResult.BOOLEAN_TYPE:
                evalResult.result = result.booleanValue;
                break;
            case xpath.XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
            case xpath.XPathResult.ORDERED_NODE_ITERATOR_TYPE:
                evalResult.result = result.booleanValue;
                let node;
                while (node = result.iterateNext()) {
                    nodes.push(node);
                }
                evalResult.result = nodes;
                evalResult.type = EvaluatorResultType.NODE_COLLECTION;
                break;
        }
        return evalResult;
    }
}
exports.XPathEvaluator = XPathEvaluator;
