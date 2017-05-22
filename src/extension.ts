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
            provideDocumentLinks: function (document: vscode.TextDocument, token: vscode.CancellationToken): vscode.DocumentLink[] {
                let re = /([a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+)?#(\d+)/g
                let txt = document.getText()
                let res: vscode.DocumentLink[] = []
                var match
                while ((match = re.exec(txt)) !== null) {
                    let p = document.positionAt(match.index)
                    let r = new vscode.Range(p, p.translate(0, match[0].length + 1))
                    if (match[1]) {
                        let uri = vscode.Uri.parse("https://github.com/" + match[1] + "/issues/" + match[2])
                        res.push(new vscode.DocumentLink(r, uri))
                    } else if (repo.length > 0) {
                        let uri = vscode.Uri.parse("https://github.com/" + repo + "/issues/" + match[2])
                        res.push(new vscode.DocumentLink(r, uri))
                    }
                }
                return res
            }
        }

        let dispose = vscode.languages.registerDocumentLinkProvider('*', provider);
        context.subscriptions.push(dispose);
    }
    if (vscode.workspace.rootPath != undefined) {
        let gconfig = path.join(vscode.workspace.rootPath, '.git', 'config')
        fs.readFile(gconfig, 'utf-8', (err, data) => {
            if (err == null) {
                for (let line of data.split('\n')) {
                    let match = /\s*url\s*=.*github.com\/([^\/]+\/[^\/]+)$/.exec(line)
                    if (match) {
                        let rawRepo = match[1]
                        // Transform "dt/ghlink.git" into "dt/ghlink"
                        let repo = rawRepo.endsWith('.git') ? rawRepo.substring(0, rawRepo.length - '.git'.length) : rawRepo
                        linkIssues(repo)
                        return
                    }
                }
            }
            linkIssues("")
        })
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}
