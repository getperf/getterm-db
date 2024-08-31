import * as cp from 'child_process';
import * as vscode from 'vscode';
import { Config } from './config';
import { initializeDatabase, Database } from './database';
import { Session } from './model/sessions';
import { Command } from './model/commands';
import { TerminalNotebookController } from './notebook_controller';
import { TerminalSessionManager } from './terminal_session_manager';
import { Util } from './util';

export class SSHProvider {
    private context: vscode.ExtensionContext;
    private  remotePath = '/tmp/vscode-shell-integration.sh';
    private db!: Promise<Database>;
    private notebookController : TerminalNotebookController;

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

    // public static getSessionIdForTerminal(terminal: vscode.Terminal): number | undefined {
    //     // return this.terminalToSessions.get(terminal);
    //     return TerminalSessionManager.getSessionId(terminal);
    // }

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
        TerminalSessionManager.setSessionId(terminal, sessionId);
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
        TerminalSessionManager.pushDataBuffer(e.terminal, e.data);
    }

    async commandStartHandler(e: vscode.TerminalShellExecutionStartEvent) {
        console.log("START COMMAND");
        const sessionId = TerminalSessionManager.getSessionId(e.terminal);
        if (!sessionId) {
            const terminalSession = TerminalSessionManager.get(e.terminal);
            console.error("セッションidが取得できませんでした : ", terminalSession);
            return;
        }
        console.log(`Terminal execution started for session ID: ${sessionId}`);
        let output = "";
        let commandText = "";
        let cwd = "";
        let exit_code = 0;
        const commandId = await Command.create(sessionId, commandText, output, cwd, exit_code);
        TerminalSessionManager.setCommandId(e.terminal, commandId);
    }

    async commandEndHandler(e: vscode.TerminalShellExecutionStartEvent) {
        console.log("END COMMAND");
        let output = "";
        let commandText = "";
        let cwd = "";
        let exit_code = 0;

        const commandId = TerminalSessionManager.getCommandId(e.terminal);
        if (!commandId) { 
            const terminalSession = TerminalSessionManager.get(e.terminal);
            console.error("セッションからコマンドIDが取得できませんでした: ", terminalSession);
            return; 
        }
        await Command.updateEndTimestamp(commandId);
        await new Promise(resolve => setTimeout(resolve, 500));
        const rawData = TerminalSessionManager.retrieveDataBuffer(e.terminal);
        if (!rawData) { 
            const terminalSession = TerminalSessionManager.get(e.terminal);
            console.error("セッションからデータバッファが取得できませんでした: ", terminalSession);
            return; 
        }
        console.log("DATABUFFER: ", rawData);
        const osc633Messages = this.parseOSC633Simple(rawData);
        output = osc633Messages.output;
        commandText = osc633Messages.command;
        cwd = osc633Messages.cwd;
        if (osc633Messages.exitCode) {
            exit_code = osc633Messages.exitCode;
        }
        // // const osc633Messages = this.parseOsc633(rawOutput);
        // const osc633Messages = this.parseOsc633(output);
        // osc633Messages.forEach((message) => {
        //     console.log("MESSAGE:", message);
        //     switch(message['type']) {
        //         case 'E':
        //             commandText = message['payload'];
        //             commandText = Util.removeTrailingSemicolon(commandText);
        //         case 'D':
        //             exit_code = parseInt(message['payload']);
        //         case 'P':
        //             cwd = message['payload'];
        //     }
        // });
        await Command.updateEnd(commandId, commandText, output, cwd, exit_code);
        const command = await Command.getById(commandId);
        console.log("コマンド登録：", command);
        await this.notebookController.updateNotebook(commandId);

    }

    // OSC 633 を解析する関数。onDidWriteTerminalData でバッファリングしたデータを解析する
    parseOSC633Simple(input: string) {
        // Split the input by OSC 633 sequences
        const parts = input.split(/\u001b\]633;/);

        let command = '';
        let output = '';
        let exitCode: number | null = null;
        let cwd = '';

        if (parts.length > 0) { command = parts[0].trim(); };
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (part.startsWith('D;')) {
                // Extract the exit code from the sequence starting with 'D;'
                exitCode = parseInt(part.slice(2).trim(), 10);
            } else if (part.startsWith('C')) {
                // Extract the output which is between 'C' and next sequence.
                output = parts[i].replace(/^C\u0007\n/, '').trim();
            } else if (part.startsWith('P;Cwd=')) {
                // Extract the working directory from the sequence starting with 'P;Cwd='
                cwd = part.slice(6).trim();
            }
        }
        return { command, exitCode, output, cwd };
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
                                                        