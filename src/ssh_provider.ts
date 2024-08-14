import * as cp from 'child_process';
import * as vscode from 'vscode';
import { Config } from './config';

export class SSHProvider {
    private context: vscode.ExtensionContext;
    private  remotePath = '/tmp/vscode-shell-integration.sh';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
        this.registerEventHandlers();
    }

    private registerCommands() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('getterm-db.showRemoteSSHView', () => {
                vscode.commands.executeCommand('workbench.view.remote');
            }),
            vscode.commands.registerCommand('getterm-db.openTerminalWithProfile', 
                this.openTerminalWithProfile, this
            ),
        );
    }

    private registerEventHandlers(): void {
        this.context.subscriptions.push(
            vscode.window.onDidChangeTerminalState(() => {
                vscode.window.showInformationMessage('シェル統合変化イベント');
            }),
            vscode.window.onDidStartTerminalShellExecution(
                async e => this.commandStartHandler(e)
            ),
            vscode.window.onDidEndTerminalShellExecution(
                async e => this.commandEndHandler(e)
            )
        );
    }

    async commandStartHandler(e: vscode.TerminalShellExecutionStartEvent) {
        console.log("START COMMAND");
        const stream = e.execution?.read();
        const buffer: string[] = [];
        for await (const data of stream!) {
            console.log("DATA:", data);
            buffer.push(data);
        }
        // 結果を1つの文字列に結合
        const rawOutput = buffer.join('');
        console.log("OUTPUT:", rawOutput);

        const osc633Messages = this.parseOsc633(rawOutput);
        console.log("OSC 633 解析:", osc633Messages);
    }

    async commandEndHandler(e: vscode.TerminalShellExecutionStartEvent) {
        console.log("END COMMAND");
    }

    private async transferShellIntegrationScript(remoteProfile:string) : Promise<boolean> {
        try {
            const getScriptCmd = 'code --locate-shell-integration-path bash';
            const shellIntegrationPath = cp.execSync(getScriptCmd).toString().trim();
            if (!shellIntegrationPath) {
                throw new Error(`faild ${getScriptCmd}`);
            }
            cp.execSync(`scp ${shellIntegrationPath} ${remoteProfile}:${this.remotePath}`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to locate shell integration path.');
            return false;
        }
        return true;
    }

    private async openTerminalWithProfile(node: any) {
        if (!node || !node.label) {
            vscode.window.showErrorMessage('プロファイルが選択されていません。');
            return;
        }
        const remoteProfile = node.label;
        console.log("Open Terminal : ", remoteProfile);
        const terminalOptions: vscode.TerminalOptions = {
            name: `SSH Capture: ${remoteProfile}`,
            shellPath: 'ssh',
            shellArgs: [remoteProfile] 
        };
        const config = Config.getInstance();
        config.set('terminalProfiles', [remoteProfile]);
        const terminal = vscode.window.createTerminal(terminalOptions);

        this.transferShellIntegrationScript(remoteProfile);
        terminal.sendText(`source "${this.remotePath}"`);
        terminal.show();
    }

	// OSC 633 を解析する関数
	parseOsc633(input: string): Array<{ type: string, payload: string }> {
		// const osc633Pattern = /\x1B\]633;([A-Z]);([^\x1B]+)\x1B\\/g;
		const osc633Pattern = /\x1B\]633;([A-Z]);([^]*)/g;
		const matches = input.matchAll(osc633Pattern);
		const results: Array<{ type: string, payload: string }> = [];

		for (const match of matches) {
			results.push({
				type: match[1],     // メッセージの種類 (A, B, C など)
				payload: match[2]   // メッセージのペイロード
			});
		}
        return results;
    }
}
