import * as vscode from 'vscode';
import { Command } from './model/Command';
import { TerminalNotebookController } from './NotebookController';
import { TerminalSessionManager } from './TerminalSessionManager';
import { Util } from './Util';
import { Logger } from './Logger';
import { XtermParser } from './XtermParser';
import { ConsernedFileDownloader as ConcernedFileDownloader } from './ConsernedFileDownloader';
import { ConsoleEventProvider } from './ConsoleEventProvider';
import { TerminalSession, TerminalSessionMode } from './TerminalSession';
import { SwitchUserCommandHandler } from './SwitchUserCommandHandler';
import { CommandParser } from './CommandParser';
// import { NewNewTerminalSessionManager } from './NewTerminalSessionManager';

export class CommandHandler {
    private notebookController : TerminalNotebookController;
    private sessionId : number | undefined;

    constructor(consoleEventProvider: ConsoleEventProvider) {
        this.notebookController = consoleEventProvider.notebookController;
    }

    varidateTerminalSession(session: TerminalSession | undefined) : boolean {
        if (!session) {
            throw new Error("terminal session not found");
        }
        if (session.disableShellIntegrationHandlers) {
            Logger.warn("Skipping command detection because shell integration events are disabled");
            return false;
        }
        if (session.terminalSessionMode !== TerminalSessionMode.Capturing &&
            session.terminalSessionMode !== TerminalSessionMode.CaptureStart
        ) {
            console.log(`Skipping command detection because capture mode is not enabled : ${session.terminalSessionMode}`);

            Logger.warn(`Skipping command detection because capture mode is not enabled : ${session.terminalSessionMode}`);
            return false;
        }
        if (!session.sessionId) {
            Logger.warn(`Unable to retrieve session ID: ${JSON.stringify(session)}`);
            return false;
        }
        return true;
    } 

    async commandStartHandler(e: vscode.TerminalShellExecutionStartEvent) {
        Logger.info(`start command handler invoked`);
        const session = TerminalSessionManager.getSession(e.terminal);
        // if (!session || !this.varidateTerminalSession(session)) {
        if (!session) {
            return;
        }
        const sessionId = session.sessionId;
        // if (!sessionId) {
        //     console.info("セッションidを取得できませんでした : ", session);
        //     return;
        // }
        Logger.info(`start command handler, session id : ${sessionId}`);
        session.changeModeCapturing(true);

        let consoleBuffer = session.consoleBuffer?.join('');
        Logger.info(`コマンド開始イベント取得バッファ : ${JSON.stringify(consoleBuffer)}`);

        const xtermParser = XtermParser.getInstance();
        const commandText = await xtermParser.parseTerminalBuffer(consoleBuffer, true);       
        Logger.debug(`コマンド開始イベントバッファ整形 : ${commandText}`);

        session.startEventCommand = Util.extractCommandByStartEvent(commandText);
        // su コマンド検知ハンドラ
        const suCommandHandler = new SwitchUserCommandHandler(e.terminal, sessionId, consoleBuffer);
        if (await suCommandHandler.handleSuCommand()) {
            if (TerminalSessionManager.getSession(e.terminal).notebookEditor) {
                await this.notebookController.updateNotebook(suCommandHandler.commandId);
            }
            session.terminalSessionMode = TerminalSessionMode.CaptureStart;
            return;
        }

        const commandId = await Command.createEmptyRow(sessionId);
        TerminalSessionManager.updateSession(e.terminal, 'commandId', commandId);
        Logger.info(`start command handler, command id created : ${commandId}`);
    }

    async commandEndHandler(e: vscode.TerminalShellExecutionStartEvent) {
        Logger.info(`end command handler invoked`);
        const endTime = new Date();
        Logger.info(`end command handler, wait few seconds.`);
        await new Promise(resolve => setTimeout(resolve, 500));
        const session = TerminalSessionManager.getSession(e.terminal);
        if (!session || !this.varidateTerminalSession(session)) {
            return;
        }
        const commandId = session.commandId;
        if (!commandId) { 
            Logger.warn(`セッションからコマンドIDが取得できませんでした: ${JSON.stringify(session)}`);
            return; 
        }
        Logger.info(`end command handler, update timestamp command id : ${commandId}`);
        await Command.updateEnd(commandId, endTime);
        let consoleBuffer = TerminalSessionManager.retrieveDataBuffer(e.terminal);
        Logger.info(`コマンド終了イベント取得バッファ : ${JSON.stringify(consoleBuffer)}`);
        if (!consoleBuffer) { 
            const terminalSession = TerminalSessionManager.getSession(e.terminal);
            Logger.error(`セッションからデータバッファが取得できませんでした: ${terminalSession}`);
            return; 
        }
        const parsedCommand = await CommandParser.parse(consoleBuffer);
        // const commandLine = e.execution.commandLine.value;
        // if (commandLine) {
        //     console.log("APIから抽出したコマンド:", commandLine);
        //     parsedCommand.command = commandLine;
        // }
        if (!parsedCommand) {
            vscode.window.showErrorMessage(
                `Oops. Failed to parse the capture data. Command could not be recorded.`
            );
            return;
        }

        // ファイル編集キャプチャーモード処理
        const downloader = new ConcernedFileDownloader(commandId, e.terminal, parsedCommand);
        if (downloader.detectFileAccessFromCommand()) {
            await downloader
                .showConfirmationMessage()
                .then((downloader : ConcernedFileDownloader) => 
                    downloader.caputureCommandAccessFile())
                .then((downloader : ConcernedFileDownloader) => 
                    downloader.saveCommandAccessFile())
                .then((downloader : ConcernedFileDownloader) => 
                    downloader.updateCommandSuccess())
                .catch((err : Error) => downloader.errorHandler(err));
        } else {
            const output = parsedCommand.output;
            const commandText = parsedCommand.command;
            const cwd = parsedCommand.cwd;
            const exit_code = parsedCommand.exitCode || 0;
            // if (parsedCommand.exitCode) {
            //     exit_code = parsedCommand.exitCode;
            // }
            await Command.updatedWithoutTimestamp(commandId, commandText, output, cwd, exit_code);
        }

        const command = await Command.getById(commandId);
        Logger.info(`update commands table ${JSON.stringify(command)}.`);
        if (TerminalSessionManager.getSession(e.terminal).notebookEditor) {
            await this.notebookController.updateNotebook(commandId);
        }
        session.changeModeCapturing(false);
    }
}
                                                        