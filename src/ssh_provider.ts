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
// import { EditedFileDownloader, EditedFileDownloaderMode } from './edited_file_downloader';
import { ConsernedFileDownloader as ConcernedFileDownloader } from './concerned_file_downloader';

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
        if (TerminalSessionManager.isShellIntegrationEventDisabled(e.terminal)) {
            console.info("シェル統合イベントが無効化されているため、コマンド検知をスキップします");
            return;
        }
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

        const session = TerminalSessionManager.get(e.terminal);
        if (!session) {
            return;
        }
        console.log("セッションモード：", session.terminalSessionMode);
        if (TerminalSessionManager.isShellIntegrationEventDisabled(e.terminal)) {
            console.info("シェル統合イベントが無効化されているため、コマンド検知をスキップします");
            return;
        }
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
        const parsedCommand = await OSC633Parser.parseOSC633AndCommand(rawData);
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
    }
}
                                                        