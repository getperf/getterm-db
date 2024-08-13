import * as vscode from 'vscode';
import { Config } from './config';

export class SSHProvider {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
    }

    private registerCommands() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('getterm-db.showRemoteSSHView', () => {
                vscode.commands.executeCommand('remote-explorer.focus');
            }),
            vscode.commands.registerCommand('getterm-db.openTerminalWithProfile', 
                this.openTerminalWithProfile, this
            ),
        );
    }

    private async openTerminalWithProfile(node: any) {
        if (!node || !node.label) {
            vscode.window.showErrorMessage('プロファイルが選択されていません。');
            return;
        }
        const profileName = node.label;
        const terminalOptions: vscode.TerminalOptions = {
            name: `SSH: ${profileName}`,
            shellPath: 'ssh',
            shellArgs: [node.label] 
        };

        const config = Config.getInstance();
        // config.set('sqliteDbPath', 'new/db/path.db');
        config.set('terminalProfiles', [node.label]);
        console.log("Config:", config);
        const terminal = vscode.window.createTerminal(terminalOptions);
        terminal.show();
    }
}
