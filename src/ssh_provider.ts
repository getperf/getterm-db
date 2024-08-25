import * as cp from 'child_process';
import * as vscode from 'vscode';
import { Config } from './config';
import { initializeDatabase, Database } from './database';
import { Session } from './model/sessions';
import { Command } from './model/commands';
import { TerminalNotebookController } from './notebook_controller';
import { Util } from './util';

export class SSHProvider {
    private context: vscode.ExtensionContext;
    private  remotePath = '/tmp/vscode-shell-integration.sh';
    private db!: Promise<Database>;
    private notebookController : TerminalNotebookController;
    private static terminalToSessions: Map<vscode.Terminal, number> = new Map();
    private terminalDataBuffer: Map<vscode.Terminal, string[]> = new Map();

    constructor(context: vscode.ExtensionContext, notebookController: TerminalNotebookController) {
        this.context = context;
        this.notebookController = notebookController;
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
            ),
            vscode.window.onDidWriteTerminalData(
                async e => this.terminalDataWriteEventHandler(e)
            )
        );
    }

    public static getSessionIdForTerminal(terminal: vscode.Terminal): number | undefined {
        return this.terminalToSessions.get(terminal);
    }

    private async copyShellIntegrationScript(remoteProfile:string) : Promise<boolean> {
        try {
            const getScriptCmd = 'code --locate-shell-integration-path bash';
            const shellIntegrationPath = cp.execSync(getScriptCmd).toString().trim();
            console.log(`シェル統合スクリプトソース：${shellIntegrationPath}`);
            if (!shellIntegrationPath) {
                throw new Error(`faild ${getScriptCmd}`);
            }
            const scpCommand = `scp "${shellIntegrationPath}" ${remoteProfile}:${this.remotePath}`;
            console.log(`シェル統合スクリプト転送コマンド:${scpCommand}`);
            const ScpCommandTimeout = 5000;
            const rc = cp.execSync(scpCommand, { timeout: ScpCommandTimeout });
            console.log(`シェル統合スクリプト転送結果：${rc}`);
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
        const terminal = await vscode.window.createTerminal(terminalOptions);
        terminal.show();

        const config = Config.getInstance();
        config.set('terminalProfiles', [remoteProfile]);
        if (!this.db) {
            this.db = initializeDatabase();
        }
        const sessionId = await Session.create(remoteProfile, 'ssh', [remoteProfile], '', '');
        const session = await Session.getById(sessionId);
        console.log("セッション履歴登録：", session);
        SSHProvider.terminalToSessions.set(terminal, sessionId);

        const isok = await this.copyShellIntegrationScript(remoteProfile);
        console.log(`シェル統合スクリプト実行結果： ${isok}`);
        if (!isok) {
            vscode.window.showErrorMessage(`シェル統合有効化スクリプトを実行できません。
                手動でスクリプトを実行してください。詳細は ～ を参照してください`);
            return;
        }
        terminal.sendText(`source "${this.remotePath}"`);
    }

    async terminalDataWriteEventHandler(e:  vscode.TerminalDataWriteEvent) {
        if (!this.terminalDataBuffer.has(e.terminal)) {
            this.terminalDataBuffer.set(e.terminal, []);
        }
        // Buffer the data chunk
        this.terminalDataBuffer.get(e.terminal)!.push(e.data);
    }

    private retrieveTerminalBuffer(terminal: vscode.Terminal) : string {
        const bufferedData = this.terminalDataBuffer.get(terminal)?.join('') ?? '';
        // Clean up the buffer
        this.terminalDataBuffer.delete(terminal);
        return bufferedData;
    }

    async commandStartHandler(e: vscode.TerminalShellExecutionStartEvent) {
        console.log("START COMMAND");
        const sessionId = SSHProvider.getSessionIdForTerminal(e.terminal);
        if (!sessionId) {
            return;
        }
        console.log(`Terminal execution started for session ID: ${sessionId}`);
        let output = "";
        let commandText = "";
        let cwd = "";
        let exit_code = 0;
        const commandId = await Command.create(sessionId, commandText, output, cwd, exit_code);

        const stream = e.execution?.read();
        const buffer: string[] = [];
        for await (const data of stream!) {
            console.log("Shell Integration Data:", data);
            buffer.push(data);
        }
        // let rawOutput = this.getTerminalBuffer(e.terminal);
        const rawOutput = buffer.join('');
        console.log("OUTPUT:", rawOutput);
        await new Promise(resolve => setTimeout(resolve, 500));
        output = this.retrieveTerminalBuffer(e.terminal);

        // const osc633Messages = this.parseOsc633(rawOutput);
        const osc633Messages = this.parseOsc633(output);
        osc633Messages.forEach((message) => {
            console.log("MESSAGE:", message);
            switch(message['type']) {
                case 'E':
                    commandText = message['payload'];
                    commandText = Util.removeTrailingSemicolon(commandText);
                case 'D':
                    exit_code = parseInt(message['payload']);
                case 'P':
                    cwd = message['payload'];
            }
        });
        await Command.updateEnd(commandId, commandText, output, cwd, exit_code);
        const command = await Command.getById(commandId);
        console.log("コマンド登録：", command);
        await this.notebookController.updateNotebook(commandId);
    }

    async commandEndHandler(e: vscode.TerminalShellExecutionStartEvent) {
        console.log("END COMMAND");
    }

    // OSC 633 を解析する関数
	parseOsc633(input: string): Array<{ type: string, payload: string }> {
		// const osc633Pattern = /\x1B\]633;([A-Z]);([^\x1B]+)\x1B\\/g;
        console.log("OSC633 input : ", input);
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
