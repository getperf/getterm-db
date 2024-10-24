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
import { CommandParser } from './command_parser';
// import { EditedFileDownloader, EditedFileDownloaderMode } from './edited_file_downloader';
import { ConsernedFileDownloader as ConcernedFileDownloader } from './concerned_file_downloader';
import { ConsoleEventProvider } from './console_event_provider';
import { TerminalSession, TerminalSessionMode } from './terminal_session';

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
            console.info("シェル統合イベントが無効化されているため、コマンド検知をスキップします");
            return false;
        }
        if (session.terminalSessionMode !== TerminalSessionMode.Capturing &&
            session.terminalSessionMode !== TerminalSessionMode.CaptureStart
        ) {
            console.info("キャプチャーモードでないため、コマンド検知をスキップします");
            return false;
        }
        if (!session.sessionId) {
            // const terminalSession = TerminalSessionManager.get(e.terminal);
            console.info("セッションidが取得できませんでした : ", session);
            return false;
        }
        return true;
    } 

    async commandStartHandler(e: vscode.TerminalShellExecutionStartEvent) {
        Logger.info(`start command handler invoked`);
        const session = TerminalSessionManager.get(e.terminal);
        if (!session || !this.varidateTerminalSession(session)) {
            return;
        }
        const sessionId = session.sessionId;
        if (!sessionId) {
            console.info("セッションidが取得できませんでした : ", session);
            return;
        }
        Logger.info(`start command handler, session id : ${sessionId}`);
        const commandId = await Command.createEmptyRow(sessionId);
        TerminalSessionManager.setCommandId(e.terminal, commandId);
        console.log("command start id:", commandId);
        Logger.info(`start command handler, command id created : ${commandId}`);
        session.changeModeCapturing(true);
        let rawData = session.consoleBuffer?.join('');
		const result = CommandParser.extractAfterOSC633CommandSequence(rawData);
        console.log("START COMMAND: ", result);
    }

    async commandEndHandler(e: vscode.TerminalShellExecutionStartEvent) {
        Logger.info(`end command handler invoked`);
        let output = "";
        let commandText = "";
        let cwd = "";
        let exit_code = 0;

        const endTime = new Date();
        await new Promise(resolve => setTimeout(resolve, 500));
        const session = TerminalSessionManager.get(e.terminal);
        if (!session || !this.varidateTerminalSession(session)) {
            return;
        }
        // if (!session) {
        //     throw new Error("terminal session not found");
        // }
        // console.log("セッションモード：", session.terminalSessionMode);
        // if (TerminalSessionManager.isShellIntegrationEventDisabled(e.terminal)) {
        //     console.info("シェル統合イベントが無効化されているため、コマンド検知をスキップします");
        //     return;
        // }
        // session.shellExecutionEventBusy = true;
        // const commandId = TerminalSessionManager.getCommandId(e.terminal);
        const commandId = session.commandId;
        // if (commandId === undefined) { 
        if (!commandId) { 
            // const terminalSession = TerminalSessionManager.get(e.terminal);
            console.info("セッションからコマンドIDが取得できませんでした: ", session);
            return; 
        }
        Logger.info(`end command handler, update timestamp command id : ${commandId}`);
        // await Command.updateEndTimestamp(commandId);
        await Command.updateEnd(commandId, endTime);
        Logger.info(`end command handler, wait few seconds.`);
        let rawData = TerminalSessionManager.retrieveDataBuffer(e.terminal);
        if (!rawData) { 
            const terminalSession = TerminalSessionManager.get(e.terminal);
            console.error("セッションからデータバッファが取得できませんでした: ", terminalSession);
            return; 
        }
        console.log("command end id:", commandId);
        // let result = OSC633Parser.extractAfterOSC633CommandSequence(rawData);
        // console.log("command text:", result.commandText);
        // console.log("remained text:", result.remainingText);
        // Logger.info(`end command handler, retrieve data : ${rawData}.`);
        // const osc633Messages = this.parseOSC633Simple(rawData);
        // const osc633Messages = OSC633Parser.parseOSC633Simple(rawData);
        const parsedCommand = await CommandParser.parseOSC633AndCommand(rawData);
        if (!parsedCommand) {
            vscode.window.showErrorMessage(
                `Oops. Failed to parse the capture data. Command could not be recorded.`
            );
            return;
        }
        // ここにファイル編集キャプチャーのコードを追加する
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
                output = parsedCommand.output;
                commandText = parsedCommand.command;
                cwd = parsedCommand.cwd;
                if (parsedCommand.exitCode) {
                    exit_code = parsedCommand.exitCode;
                }
                await Command.updatedWithoutTimestamp(commandId, commandText, output, cwd, exit_code);
        }

        // ここにファイル編集キャプチャーのコードを追加する
        // const editedFileDownloader = TerminalSessionManager.getEditedFileDownloader(e.terminal) 
        //     || new EditedFileDownloader(e.terminal, parsedCommand);
        // if (editedFileDownloader.checkRunningMode()) {
        //     console.log("ファイル編集モード:", editedFileDownloader);
        //     switch(editedFileDownloader.mode) {
        //         case EditedFileDownloaderMode.Caputure:
        //             await editedFileDownloader
        //                 .storeTerminalSessions()
        //                 .showConfirmationMessage()
        //                 .then((downloader : EditedFileDownloader) => downloader.captureDownloadFile())
        //                 .catch((err : Error) => editedFileDownloader.errorHandler(err));
        //             break;
        //         case EditedFileDownloaderMode.Save:
        //             await editedFileDownloader
        //                 .resetTerminalSessions()
        //                 .saveEditedFile()
        //                 .then((downloader : EditedFileDownloader) => downloader.updateCommand(commandId))
        //                 .then((downloader : EditedFileDownloader) => downloader.updateNotebook(commandId))
        //                 .catch((err : Error) => editedFileDownloader.errorHandler(err));
        //             break;
        //         default:
        //             console.log(`skip edited file download for ${editedFileDownloader.mode}`);
        //             break;
        //     }
        //     return;
        // }

        const command = await Command.getById(commandId);
        Logger.info(`end command handler, update commands table : ${command}.`);
        if (TerminalSessionManager.getNotebookEditor(e.terminal)) {
            await this.notebookController.updateNotebook(commandId);
        }
        session.changeModeCapturing(false);
        // if (session.terminalSessionMode === TerminalSessionMode.CaptureStart) {
        //     session.terminalSessionMode = TerminalSessionMode.Capturing;
        // }
    }
}
                                                        