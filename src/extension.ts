'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    function linkIssues(repo: string) {
        let provider = {
            provideDocumentLinks: function(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.DocumentLink[] {
                let re = /#(\d+)/g
                let txt = document.getText()
                let res: vscode.DocumentLink[] = []
                var match
                while ((match = re.exec(txt)) !== null) {
                    let p = document.positionAt(match.index)
                    let r = new vscode.Range(p, p.translate(0, match[1].length+1))
                    let uri = vscode.Uri.parse("https://github.com/"+repo+"/issues/"+match[1])
                    res.push(new vscode.DocumentLink(r, uri))
                }
                return res
            }
        }

        let dispose = vscode.languages.registerDocumentLinkProvider('go', provider);
        context.subscriptions.push(dispose);
    }

    let gconfig = path.join(vscode.workspace.rootPath, '.git', 'config')
    fs.readFile(gconfig, 'utf-8', (err, data) => {
        if (err) {
            return
        }
        for (let line of data.split('\n')) {
            let match = /\s*url\s*=.*github.com\/([^\/]+\/[^\/]+)(?:\.git|$)/.exec(line)
            if (match) {
                let repo = match[1]
                linkIssues(repo)
                return
            }
        }
    })
}

// this method is called when your extension is deactivated
export function deactivate() {
}