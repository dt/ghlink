'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { join } from 'path'
import { promise as parseGitConfig } from 'parse-git-config'

const REGEXP_REPOS = /@([a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+)\b/g
const REGEXP_ISSUES = /@?([a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+)?#(\d+)\b/g

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    const currentRepo = vscode.workspace.rootPath ? await parseRepoName(vscode.workspace.rootPath) : null

    const disposable = vscode.languages.registerDocumentLinkProvider('*', {
        provideDocumentLinks: function (document: vscode.TextDocument): vscode.DocumentLink[] {
            return [
                ...generateLinks(document, REGEXP_REPOS, match => `https://github.com/${match[1]}`),
                ...generateLinks(document, REGEXP_ISSUES, match => (match[1] || currentRepo) ?
                    `https://github.com/${match[1] || currentRepo}/issues/${match[2]}` : null)
            ]
        }
    });
    context.subscriptions.push(disposable);
}

function generateLinks(document: vscode.TextDocument, re: RegExp, matchToUrl: (match: RegExpExecArray) => string | null): vscode.DocumentLink[] {
    const txt = document.getText()
    const res: vscode.DocumentLink[] = []
    let match
    while ((match = re.exec(txt)) !== null) {
        const url = matchToUrl(match)
        if (url) {
            const position = document.positionAt(match.index)
            const range = new vscode.Range(position, position.translate(0, match[0].length))
            res.push(new vscode.DocumentLink(range, vscode.Uri.parse(url)))
        }
    }
    return res
}

async function parseRepoName(directory: string): Promise<string | null> {
    try {
        const pathToConfig = join(directory, '.git', 'config')
        const config = await parseGitConfig({ path: pathToConfig, expandKeys: true }) || {}

        // First, check whether `origin` remote is on GitHub.
        const originRepoName = config.remote.origin && urlToRepoName(config.remote.origin.url)
        if (originRepoName) {
            return originRepoName
        }

        // Use the first GitHub remote available.
        for (let remoteName in config.remote) {
            const repoName = urlToRepoName(config.remote[remoteName].url)
            if (repoName) {
                return repoName
            }
        }
    } catch {}

    return null
}

function urlToRepoName(url: string): string | null {
    const match = /.*github\.com\/([^\/]+\/[^\/]+)$/.exec(url)
    // If there's a match, trim "dt/ghlink.git" -> "dt/ghlink"
    return match ? match[1].replace(/\.git$/, '') : null
}

// this method is called when your extension is deactivated
export function deactivate() {
}
