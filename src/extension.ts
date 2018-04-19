'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { join } from 'path'
import { promise as parseGitConfig } from 'parse-git-config'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    const originRepo = vscode.workspace.rootPath ? await parseRepoName(vscode.workspace.rootPath) : null

    const disposable = vscode.languages.registerDocumentLinkProvider('*', {
        provideDocumentLinks: function (document: vscode.TextDocument): vscode.DocumentLink[] {
            return generateIssueLinks(document, originRepo)
        }
    });
    context.subscriptions.push(disposable);
}

function generateIssueLinks(document: vscode.TextDocument, originRepo: string | null): vscode.DocumentLink[] {
    const re = /([a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+)?#(\d+)/g
    const txt = document.getText()
    const res: vscode.DocumentLink[] = []
    let match
    while ((match = re.exec(txt)) !== null) {
        const position = document.positionAt(match.index)
        const range = new vscode.Range(position, position.translate(0, match[0].length))
        const uri = vscode.Uri.parse(`https://github.com/${match[1] || originRepo}/issues/${match[2]}`)
        res.push(new vscode.DocumentLink(range, uri))
    }
    return res
}

async function parseRepoName(directory: string): Promise<string | null> {
    try {
        const pathToConfig = join(directory, '.git', 'config')
        const config = await parseGitConfig({ path: pathToConfig, expandKeys: true })
        return urlToRepoName(config.remote.origin.url)
    } catch {
        return null
    }
}

function urlToRepoName(url: string): string | null {
    const match = /.*github\.com\/([^\/]+\/[^\/]+)$/.exec(url)
    // If there's a match, trim "dt/ghlink.git" -> "dt/ghlink"
    return match ? match[1].replace(/\.git$/, '') : null
}

// this method is called when your extension is deactivated
export function deactivate() {
}
