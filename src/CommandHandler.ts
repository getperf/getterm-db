import * as vscode from "vscode";
import { Command } from "./model/Command";
import { TerminalNotebookController } from "./NotebookController";
import { TerminalSessionManager } from "./TerminalSessionManager";
import { Util } from "./Util";
import { Logger } from "./Logger";
import { XtermParser } from "./XtermParser";
import { ConsernedFileDownloader as ConcernedFileDownloader } from "./ConsernedFileDownloader";
import { ConsoleEventProvider } from "./ConsoleEventProvider";
import { TerminalSession, TerminalSessionMode } from "./TerminalSession";
import { SwitchUserCommandHandler } from "./SwitchUserCommandHandler";
import { CommandParser } from "./CommandParser";
// import { NewNewTerminalSessionManager } from './NewTerminalSessionManager';

export class CommandHandler {
    private notebookController: TerminalNotebookController;
    private sessionId: number | undefined;

    constructor(consoleEventProvider: ConsoleEventProvider) {
        this.notebookController = consoleEventProvider.notebookController;
    }

    varidateTerminalSession(session: TerminalSession | undefined): boolean {
        if (!session) {
            throw new Error("terminal session not found");
        }
        if (session.disableShellIntegrationHandlers) {
            Logger.warn(
                "Skipping command detection because shell integration events are disabled",
            );
            return false;
        }
        if (
            session.terminalSessionMode !== TerminalSessionMode.Capturing &&
            session.terminalSessionMode !== TerminalSessionMode.CaptureStart
        ) {
            console.log(
                `Skipping command detection because capture mode is not enabled : ${session.terminalSessionMode}`,
            );

            Logger.warn(
                `Skipping command detection because capture mode is not enabled : ${session.terminalSessionMode}`,
            );
            return false;
        }
        if (!session.sessionId) {
            Logger.warn(
                `Unable to retrieve session ID: ${JSON.stringify(session)}`,
            );
            return false;
        }
        return true;
    }

    async commandStartHandler(e: vscode.TerminalShellExecutionStartEvent) {
        Logger.info(`start command handler invoked`);
        const start = new Date();
        const session = TerminalSessionManager.findSession(e.terminal);
        if (!session) {
            Logger.info(`skip command start handler, session not found : ${e.terminal.name}`);
            console.info("セッションが見つかりません : ", e.terminal.name);
            return;
        }
        session.commandStart = start;
        const sessionId = session.sessionId;
        Logger.info(`start command handler, session id : ${sessionId}`);
        session.changeModeCapturing(true);

        let consoleBuffer = session.consoleBuffer?.join("");
        Logger.info(
            `コマンド開始イベント取得バッファ : ${JSON.stringify(consoleBuffer)}`,
        );

        const xtermParser = XtermParser.getInstance();
        const commandText = await xtermParser.parseTerminalBuffer(
            consoleBuffer,
            true,
        );
        Logger.debug(`コマンド開始イベントバッファ整形 : ${commandText}`);

        session.startEventCommand =
            Util.extractCommandByStartEvent(commandText);
        // su コマンド検知ハンドラ
        const suCommandHandler = new SwitchUserCommandHandler(
            e.terminal,
            sessionId,
            consoleBuffer,
        );
        if (await suCommandHandler.handleSuCommand()) {
            if (TerminalSessionManager.getSession(e.terminal).notebookEditor) {
                await this.notebookController.updateNotebook(
                    suCommandHandler.commandId,
                );
            }
            session.terminalSessionMode = TerminalSessionMode.CaptureStart;
            return;
        }

        const commandId = await Command.createEmptyRow(sessionId);
        session.commandId = commandId;
        // TerminalSessionManager.updateSession(
        //     e.terminal,
        //     "commandId",
        //     commandId,
        // );
        Logger.info(`start command handler, command id created : ${commandId}`);
    }

    async commandEndHandler(e: vscode.TerminalShellExecutionStartEvent) {
        Logger.info(`end command handler invoked`);
        const endTime = new Date();
        Logger.info(`end command handler, wait few seconds.`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const session = TerminalSessionManager.findSession(e.terminal);
        if (!session || !this.varidateTerminalSession(session)) {
            Logger.info(`skip command end handler, session not found : ${e.terminal.name}`);
            return;
        }
        const commandId = session.commandId;
        if (!commandId) {
            Logger.warn(`command id not found from session: ${session.sessionName}`);
            vscode.window.showInformationMessage("Failed to retrieve the command. This issue may occur during the first command retrieval after the session starts.");
            return;
        }
        Logger.info(`end command handler started, command id : ${commandId}`);
        // await Command.updateEnd(commandId, endTime);
        if (session.commandStart) {
            await Command.updateTimestamp(commandId, session.commandStart, endTime);
        } else {
            Logger.warn(`command start time not found for session: ${session.sessionName}`);
        }

        let consoleBuffer = TerminalSessionManager.retrieveDataBuffer(e.terminal);
        Logger.info(`command buffer : ${JSON.stringify(consoleBuffer)}`);

        if (!consoleBuffer) {
            Logger.error(`couldn't retrieve command buffer from session: ${session.sessionName}`);
            return;
        }
        const parsedCommand = await CommandParser.parse(consoleBuffer);
        const commandLine = e.execution.commandLine.value;
        if (commandLine) {
            Logger.info(`command text from API: ${commandLine}`);
        }
        if (!parsedCommand) {
            vscode.window.showErrorMessage(
                `Oops. Failed to parse the capture data. Command could not be recorded.`,
            );
            return;
        }

        // ファイル編集キャプチャーモード処理
        const downloader = new ConcernedFileDownloader(
            commandId,
            e.terminal,
            parsedCommand,
        );
        if (downloader.detectFileAccessFromCommand()) {
            await downloader
                .showConfirmationMessage()
                .then((downloader: ConcernedFileDownloader) =>
                    downloader.caputureCommandAccessFile(),
                )
                .then((downloader: ConcernedFileDownloader) =>
                    downloader.saveCommandAccessFile(),
                )
                .then((downloader: ConcernedFileDownloader) =>
                    downloader.updateCommandSuccess(),
                )
                .catch((err: Error) => downloader.errorHandler(err));
        } else {
            const output = parsedCommand.output;
            const commandText = parsedCommand.command;
            const cwd = parsedCommand.cwd;
            const exit_code = parsedCommand.exitCode || 0;
            // if (parsedCommand.exitCode) {
            //     exit_code = parsedCommand.exitCode;
            // }
            await Command.updatedWithoutTimestamp(
                commandId,
                commandText,
                output,
                cwd,
                exit_code,
            );
        }

        const command = await Command.getById(commandId);
        Logger.info(`update commands table ${JSON.stringify(command)}.`);
        if (TerminalSessionManager.getSession(e.terminal).notebookEditor) {
            await this.notebookController.updateNotebook(commandId);
        }
        session.changeModeCapturing(false);
    }
}
