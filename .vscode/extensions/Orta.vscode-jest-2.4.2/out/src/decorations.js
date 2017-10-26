"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
function failingItName() {
    return vscode_1.window.createTextEditorDecorationType({
        overviewRulerColor: 'red',
        overviewRulerLane: vscode_1.OverviewRulerLane.Left,
        light: {
            before: {
                color: '#FF564B',
                contentText: '●',
            },
        },
        dark: {
            before: {
                color: '#AD322D',
                contentText: '●',
            },
        },
    });
}
exports.failingItName = failingItName;
function skipItName() {
    return vscode_1.window.createTextEditorDecorationType({
        overviewRulerColor: 'yellow',
        overviewRulerLane: vscode_1.OverviewRulerLane.Left,
        light: {
            before: {
                color: '#fed37f',
                contentText: '○',
            },
        },
        dark: {
            before: {
                color: '#fed37f',
                contentText: '○',
            },
        },
    });
}
exports.skipItName = skipItName;
function passingItName() {
    return vscode_1.window.createTextEditorDecorationType({
        overviewRulerColor: 'green',
        overviewRulerLane: vscode_1.OverviewRulerLane.Left,
        light: {
            before: {
                color: '#3BB26B',
                contentText: '●',
            },
        },
        dark: {
            before: {
                color: '#2F8F51',
                contentText: '●',
            },
        },
    });
}
exports.passingItName = passingItName;
function notRanItName() {
    return vscode_1.window.createTextEditorDecorationType({
        overviewRulerColor: 'darkgrey',
        overviewRulerLane: vscode_1.OverviewRulerLane.Left,
        dark: {
            before: {
                color: '#3BB26B',
                contentText: '○',
            },
        },
        light: {
            before: {
                color: '#2F8F51',
                contentText: '○',
            },
        },
    });
}
exports.notRanItName = notRanItName;
function failingAssertionStyle(text) {
    return vscode_1.window.createTextEditorDecorationType({
        isWholeLine: true,
        overviewRulerColor: 'red',
        overviewRulerLane: vscode_1.OverviewRulerLane.Left,
        light: {
            before: {
                color: '#FF564B',
            },
        },
        dark: {
            before: {
                color: '#AD322D',
            },
        },
        after: {
            contentText: ' // ' + text,
        },
    });
}
exports.failingAssertionStyle = failingAssertionStyle;
//# sourceMappingURL=decorations.js.map