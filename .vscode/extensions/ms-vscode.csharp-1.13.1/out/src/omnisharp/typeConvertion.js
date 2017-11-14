/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function toLocation(location) {
    const fileName = vscode.Uri.file(location.FileName);
    return toLocationFromUri(fileName, location);
}
exports.toLocation = toLocation;
function toLocationFromUri(uri, location) {
    const position = new vscode.Position(location.Line - 1, location.Column - 1);
    const endLine = location.EndLine;
    const endColumn = location.EndColumn;
    if (endLine !== undefined && endColumn !== undefined) {
        const endPosition = new vscode.Position(endLine - 1, endColumn - 1);
        return new vscode.Location(uri, new vscode.Range(position, endPosition));
    }
    return new vscode.Location(uri, position);
}
exports.toLocationFromUri = toLocationFromUri;
function toRange(rangeLike) {
    let { Line, Column, EndLine, EndColumn } = rangeLike;
    return new vscode.Range(Line - 1, Column - 1, EndLine - 1, EndColumn - 1);
}
exports.toRange = toRange;
function toRange2(rangeLike) {
    let { StartLine, StartColumn, EndLine, EndColumn } = rangeLike;
    return new vscode.Range(StartLine - 1, StartColumn - 1, EndLine - 1, EndColumn - 1);
}
exports.toRange2 = toRange2;
function createRequest(document, where, includeBuffer = false) {
    let Line, Column;
    if (where instanceof vscode.Position) {
        Line = where.line + 1;
        Column = where.character + 1;
    }
    else if (where instanceof vscode.Range) {
        Line = where.start.line + 1;
        Column = where.start.character + 1;
    }
    // for metadata sources, we need to remove the [metadata] from the filename, and prepend the $metadata$ authority
    // this is expected by the Omnisharp server to support metadata-to-metadata navigation
    let fileName = document.uri.scheme === "omnisharp-metadata" ?
        `${document.uri.authority}${document.fileName.replace("[metadata] ", "")}` :
        document.fileName;
    let request = {
        FileName: fileName,
        Buffer: includeBuffer ? document.getText() : undefined,
        Line,
        Column
    };
    return request;
}
exports.createRequest = createRequest;
function toDocumentSymbol(bucket, node, containerLabel) {
    let ret = new vscode.SymbolInformation(node.Location.Text, kinds[node.Kind], toRange(node.Location), undefined, containerLabel);
    if (node.ChildNodes) {
        for (let child of node.ChildNodes) {
            toDocumentSymbol(bucket, child, ret.name);
        }
    }
    bucket.push(ret);
}
exports.toDocumentSymbol = toDocumentSymbol;
let kinds = Object.create(null);
kinds['NamespaceDeclaration'] = vscode.SymbolKind.Namespace;
kinds['ClassDeclaration'] = vscode.SymbolKind.Class;
kinds['FieldDeclaration'] = vscode.SymbolKind.Field;
kinds['PropertyDeclaration'] = vscode.SymbolKind.Property;
kinds['EventFieldDeclaration'] = vscode.SymbolKind.Property;
kinds['MethodDeclaration'] = vscode.SymbolKind.Method;
kinds['EnumDeclaration'] = vscode.SymbolKind.Enum;
kinds['StructDeclaration'] = vscode.SymbolKind.Enum;
kinds['EnumMemberDeclaration'] = vscode.SymbolKind.Property;
kinds['InterfaceDeclaration'] = vscode.SymbolKind.Interface;
kinds['VariableDeclaration'] = vscode.SymbolKind.Variable;
//# sourceMappingURL=typeConvertion.js.map