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
        console.log("command start id:", commandId);
        Logger.info(`start command handler, command id created : ${commandId}`);
    }

    async commandEndHandler(e: vscode.TerminalShellExecutionStartEvent) {
        Logger.info(`end command handler invoked`);
        let output = "";
        let commandText = "";
        let cwd = "";
        let exit_code = 0;

        const endTime = new Date();
        await new Promise(resolve => setTimeout(resolve, 500));
        const commandId = TerminalSessionManager.getCommandId(e.terminal);
        if (commandId === undefined) { 
            const terminalSession = TerminalSessionManager.get(e.terminal);
            console.error("セッションからコマンドIDが取得できませんでした: ", terminalSession);
            return; 
        }
        Logger.info(`end command handler, update timestamp command id : ${commandId}`);
        // await Command.updateEndTimestamp(commandId);
        await Command.updateEnd(commandId, endTime);
        Logger.info(`end command handler, wait few seconds.`);
        const rawData = TerminalSessionManager.retrieveDataBuffer(e.terminal);
        if (!rawData) { 
            const terminalSession = TerminalSessionManager.get(e.terminal);
            console.error("セッションからデータバッファが取得できませんでした: ", terminalSession);
            return; 
        }
        console.log("command end id:", commandId);
        console.log("command buffer:", rawData);
        Logger.info(`end command handler, retrieve data : ${rawData}.`);
        // const osc633Messages = this.parseOSC633Simple(rawData);
        const osc633Messages = OSC633Parser.parseOSC633Simple(rawData);
        output = osc633Messages.output;
        commandText = osc633Messages.command;
        cwd = osc633Messages.cwd;
        if (osc633Messages.exitCode) {
            exit_code = osc633Messages.exitCode;
        }
        await Command.updatedWithoutTimestamp(commandId, commandText, output, cwd, exit_code);
        const command = await Command.getById(commandId);
        Logger.info(`end command handler, update commands table : ${command}.`);
        if (TerminalSessionManager.getNotebookEditor(e.terminal)) {
            await this.notebookController.updateNotebook(commandId);
        }
    }
}
                                                        