import * as vscode from 'vscode';

export class NotebookMuteManager {
    private static muteMap: Map<vscode.NotebookEditor, boolean> = new Map();
    private static statusBarItem: vscode.StatusBarItem;

    constructor(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.commands.registerCommand('getterm-db.toggleMute', this.toggleMute.bind(this))
        );

        // ステータスバーの初期化
        NotebookMuteManager.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        NotebookMuteManager.statusBarItem.command = 'getterm-db.toggleMute';
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

        const currentState = NotebookMuteManager.muteMap.get(editor) || false;
        const newState = !currentState;
        NotebookMuteManager.muteMap.set(editor, newState);

        // VS Code のコンテキストを更新
        await vscode.commands.executeCommand(
            'setContext',
            `notebookMuteState:${editor.notebook.uri.toString()}`,
            newState
        );

        vscode.window.showInformationMessage(
            `Notebook is ${newState ? 'Muted' : 'Unmuted'}`
        );

        this.updateStatusBar();
    }

    private updateStatusBar() {
        const editor = vscode.window.activeNotebookEditor;
        if (!editor) {
            NotebookMuteManager.statusBarItem.hide();
            return;
        }

        const isMuted = NotebookMuteManager.muteMap.get(editor) || false;

        NotebookMuteManager.statusBarItem.text = isMuted ? '$(mute) Mute' : '$(unmute) Unmute';
        NotebookMuteManager.statusBarItem.show();
    }

    static isMuted(editor: vscode.NotebookEditor): boolean {
        return NotebookMuteManager.muteMap.get(editor) || false;
    }
}
