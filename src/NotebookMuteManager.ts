import * as vscode from 'vscode';

export class NotebookMuteManager {
    private static muteMap: Map<string, boolean> = new Map();
    private static statusBarItem: vscode.StatusBarItem;

    constructor(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.commands.registerCommand('notebook.toggleMute', this.toggleMute.bind(this))
        );

        // ステータスバーの初期化
        NotebookMuteManager.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        NotebookMuteManager.statusBarItem.command = 'notebook.toggleMute';
        context.subscriptions.push(NotebookMuteManager.statusBarItem);

        this.updateStatusBar();
        
        // エディターが切り替わったときにステータスバーを更新
        vscode.window.onDidChangeActiveNotebookEditor(() => this.updateStatusBar());
    }

    private async toggleMute() {
        const editor = vscode.window.activeNotebookEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active notebook found.');
            return;
        }

        const notebookUri = editor.notebook.uri.toString();
        const currentState = NotebookMuteManager.muteMap.get(notebookUri) || false;
        const newState = !currentState;
        NotebookMuteManager.muteMap.set(notebookUri, newState);

        // VS Code のコンテキストを更新
        await vscode.commands.executeCommand(
            'setContext',
            `notebookMuteState:${notebookUri}`,
            newState
        );

        vscode.window.showInformationMessage(
            `Notebook is  ${newState ? 'Muted' : 'Unmuted'}`
        );

        this.updateStatusBar();
    }

    private updateStatusBar() {
        const editor = vscode.window.activeNotebookEditor;
        if (!editor) {
            NotebookMuteManager.statusBarItem.hide();
            return;
        }

        const notebookUri = editor.notebook.uri.toString();
        const isMuted = NotebookMuteManager.muteMap.get(notebookUri) || false;

        NotebookMuteManager.statusBarItem.text = isMuted ? '$(mute) Mute' : '$(unmute) Unmute';
        NotebookMuteManager.statusBarItem.show();
    }

    static isMuted(notebookUri: vscode.Uri): boolean {
        return NotebookMuteManager.muteMap.get(notebookUri.toString()) || false;
    }
}
