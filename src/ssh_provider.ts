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
    // private  remotePath = '/tmp/vscode-shell-integration.sh';
    // private db!: Promise<Database>;
    private notebookController : TerminalNotebookController;

    constructor(context: vscode.ExtensionContext, notebookController: TerminalNotebookController) {
        this.context = context;
        this.notebookController = notebookController;
        this.registerEventHandlers();
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

    async terminalDataWriteEventHandler(e:  vscode.TerminalDataWriteEvent) {
        TerminalSessionManager.pushDataBufferExcludingOpening(e.terminal, e.data);
    }

    async commandStartHandler(e: vscode.TerminalShellExecutionStartEvent) {
        Logger.info(`start command handler invoked`);
        const sessionId = await TerminalSessionManager.getSessionIdWithRetry(e.terminal);
        if (!sessionId) {
            const terminalSession = TerminalSessionManager.get(e.terminal);
            console.info("セッションidが取得できませんでした : ", terminalSession);
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
            console.info("セッションからコマンドIDが取得できませんでした: ", terminalSession);
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
        // const osc633Messages = OSC633Parser.parseOSC633Simple(rawData);
        const parsedCommand = OSC633Parser.parseOSC633AndCommand(rawData);
        if (!parsedCommand) {
            vscode.window.showErrorMessage(
                `Oops. Failed to parse the capture data. Command could not be recorded.`
            );
            return;
        }
        output = parsedCommand.output;
        commandText = parsedCommand.command;
        cwd = parsedCommand.cwd;
        if (parsedCommand.exitCode) {
            exit_code = parsedCommand.exitCode;
        }
        await Command.updatedWithoutTimestamp(commandId, commandText, output, cwd, exit_code);
        const command = await Command.getById(commandId);
        Logger.info(`end command handler, update commands table : ${command}.`);
        if (TerminalSessionManager.getNotebookEditor(e.terminal)) {
            await this.notebookController.updateNotebook(commandId);
        }
    }
}
                                                        