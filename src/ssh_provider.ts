import * as cp from 'child_process';
import * as vscode from 'vscode';
import { Config } from './config';
import { initializeDatabase, Database } from './database';
import { Session } from './model/sessions';
import { Command } from './model/commands';
import { TerminalNotebookController } from './notebook_controller';
import { TerminalSessionManager } from './terminal_session_manager';
import { Util } from './util';
import { Logger } from './logger';
import { OSC633Parser } from './osc633_parser';

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
                Logger.info("show remove ssh view command invoked");
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
                Logger.info("terminal state change event invoked");
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
            Logger.info(`shell integration script path ：${shellIntegrationPath}`);
            if (!shellIntegrationPath) {
                throw new Error(`faild ${getScriptCmd}`);
            }
            const scpCommand = `scp "${shellIntegrationPath}" ${remoteProfile}:${this.remotePath}`;
            Logger.info(`shell integration script copy :${scpCommand}`);
            const ScpCommandTimeout = 5000;
            const rc = cp.execSync(scpCommand, { timeout: ScpCommandTimeout });
            Logger.info(`shell integration script copy result ：${rc}`);
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
        Logger.info(`open terminal profile : ${remoteProfile}`);
        const terminalOptions: vscode.TerminalOptions = {
            name: `SSH Capture: ${remoteProfile}`,
            shellPath: 'ssh',
            shellArgs: [remoteProfile] 
        };
        const terminal = await vscode.window.createTerminal(terminalOptions);
        terminal.show();

        const config = Config.getInstance();
        config.set('terminalProfiles', [remoteProfile]);
        Logger.info(`open terminal, save profile : ${remoteProfile}`);
        if (!this.db) {
            this.db = initializeDatabase();
        }
        const sessionId = await Session.create(remoteProfile, 'ssh', [remoteProfile], '', '');
        const session = await Session.getById(sessionId);
        console.log("セッション履歴登録：", session);
        TerminalSessionManager.setSessionId(terminal, sessionId);
        Logger.info(`open terminal, regist session id : ${sessionId}`);

        const isok = await this.copyShellIntegrationScript(remoteProfile);
        Logger.info(`open terminal, shell integration activate : ${isok}`);
        if (!isok) {
            vscode.window.showErrorMessage(`シェル統合有効化スクリプトを実行できません。
                手動でスクリプトを実行してください。詳細は ～ を参照してください`);
            return;
        }
        terminal.sendText(`source "${this.remotePath}"`);
        Logger.info(`open terminal, end`);
    }

    async terminalDataWriteEventHandler(e:  vscode.TerminalDataWriteEvent) {
        // TerminalSessionManager.pushDataBuffer(e.terminal, e.data);
        TerminalSessionManager.pushDataBufferExcludingOpening(e.terminal, e.data);
    }

    async commandStartHandler(e: vscode.TerminalShellExecutionStartEvent) {
        Logger.info(`start command handler invoked`);
        const sessionId = await TerminalSessionManager.getSessionIdWithRetry(e.terminal);
        if (!sessionId) {
            const terminalSession = TerminalSessionManager.get(e.terminal);
            console.error("セッションidが取得できませんでした : ", terminalSession);
            return;
        }
        Logger.info(`start command handler, session id : ${sessionId}`);

        let output = "";
        let commandText = "";
        let cwd = "";
        let exit_code = 0;
        const commandId = await Command.create(sessionId, commandText, output, cwd, exit_code);
        TerminalSessionManager.setCommandId(e.terminal, commandId);
        Logger.info(`start command handler, command id created : ${commandId}`);
    }

    async commandEndHandler(e: vscode.TerminalShellExecutionStartEvent) {
        Logger.info(`end command handler invoked`);
        let output = "";
        let commandText = "";
        let cwd = "";
        let exit_code = 0;

        const commandId = TerminalSessionManager.getCommandId(e.terminal);
        if (commandId === undefined) { 
            const terminalSession = TerminalSessionManager.get(e.terminal);
            console.error("セッションからコマンドIDが取得できませんでした: ", terminalSession);
            return; 
        }
        Logger.info(`end command handler, update timestamp command id : ${commandId}`);
        await Command.updateEndTimestamp(commandId);
        await new Promise(resolve => setTimeout(resolve, 500));
        Logger.info(`end command handler, wait few seconds.`);
        const rawData = TerminalSessionManager.retrieveDataBuffer(e.terminal);
        if (!rawData) { 
            const terminalSession = TerminalSessionManager.get(e.terminal);
            console.error("セッションからデータバッファが取得できませんでした: ", terminalSession);
            return; 
        }
        Logger.info(`end command handler, retrieve data : ${rawData}.`);
        // const osc633Messages = this.parseOSC633Simple(rawData);
        const osc633Messages = OSC633Parser.parseOSC633Simple(rawData);
        output = osc633Messages.output;
        commandText = osc633Messages.command;
        cwd = osc633Messages.cwd;
        if (osc633Messages.exitCode) {
            exit_code = osc633Messages.exitCode;
        }
        await Command.updateEnd(commandId, commandText, output, cwd, exit_code);
        const command = await Command.getById(commandId);
        Logger.info(`end command handler, update commands table : ${command}.`);

        await this.notebookController.updateNotebook(commandId);

    }

    extractCommandResult(output: string): string | null {
        // Split the output by control characters and sequences
        const parts = output.split('\u0007\u001B]633;B\u0007');
        // Check if there is a part after the final sequence
        if (parts.length < 2) {
            return null;
        }
        // Extract the part after the control sequence and remove the prompt
        const result = parts[1].split('\n')[0].trim();
        // Ensure the prompt is not included in the result
        if (result.startsWith('[')) {
            return null;
        }
        return result;
    }

    extractOutputOfOSC633B(output: string): string {
        // Split the output by the OSC 633;B sequence
        const parts = output.split('\u0007\u001B]633;B\u0007');
        if (parts.length < 2) {return ''; }
        
        // The relevant part is after the OSC 633;B sequence
        let result = parts[1].trim();
        
        // Remove the prompt if it exists
        const promptPattern = /\[\w+@\w+.*?\$\s*$/;
        result = result.replace(promptPattern, '').trim();
        
        // Return the cleaned-up result
        return result.length > 0 ? result : '';
    }

    // OSC 633 を解析する関数。onDidWriteTerminalData でバッファリングしたデータを解析する
    parseOSC633Simple(input: string) {
        // Split the input by OSC 633 sequences
        const parts = input.split(/\u001b\]633;/);

        let command = '';
        let output = '';
        let exitCode: number | null = null;
        let cwd = '';

        if (parts.length > 0) { 
            command = Util.cleanDeleteSequenceString(parts[0].trim());
        };
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
                cwd = part.slice(6).replace(/\x07/, '').trim();
            }
        }
        console.log("COMMAND OUTPUT:" , output);
        if (output === '' || output === 'C\u0007') { 
            console.log("PARSE OSC633B");
            output = this.extractOutputOfOSC633B(input);
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
                                                        