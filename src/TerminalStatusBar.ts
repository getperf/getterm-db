import * as vscode from 'vscode';

export class TerminalStatusBarProvider {
    private statusBarItem: vscode.StatusBarItem;
    private isMuted: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        // ステータスバーアイテムを作成
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'getterm-db.toggleMute';
        context.subscriptions.push(this.statusBarItem);

        // コマンド登録（クリックでMute On/Off）
        context.subscriptions.push(
            vscode.commands.registerCommand('getterm-db.toggleMute', () => {
                this.toggleMute();
            })
        );

        this.updateStatusBar();
    }

    private updateStatusBar() {
        this.statusBarItem.text = this.isMuted ? '🔇 Mute On' : '🎤 Mute Off';
        this.statusBarItem.tooltip = 'Click to toggle mute mode';
        this.statusBarItem.show();
    }

    private toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateStatusBar();
    }

    public dispose() {
        this.statusBarItem.dispose();
    }
}
