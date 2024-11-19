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
import { ConsernedFileDownloader as ConcernedFileDownloader } from './concerned_file_downloader';
import { CommandHandler } from './command_handler';
import { SessionHandler } from './session_handler';

export class ConsoleEventProvider {
    private context: vscode.ExtensionContext;
    notebookController : TerminalNotebookController;

    constructor(context: vscode.ExtensionContext, notebookController: TerminalNotebookController) {
        this.context = context;
        this.notebookController = notebookController;
        this.registerEventHandlers();
    }

    private registerEventHandlers(): void {
        this.context.subscriptions.push(
            vscode.window.onDidChangeTerminalState(() => {
                Logger.info("terminal state change event invoked");
                // vscode.window.showInformationMessage('シェル統合変化イベント');
            }),
            // vscode.window.onDidCloseTerminal((terminal) => {
            //     console.log(`Terminal closed: ${terminal.name}`);
            //     vscode.window.showInformationMessage(`Closed terminal: ${terminal.name}`);
            //     async terminal => this.sessionCloseEvent(terminal)
            // }),
            vscode.window.onDidOpenTerminal(
                async terminal => this.sessionOpenEvent(terminal)
            ),
            vscode.window.onDidCloseTerminal(
                async terminal => this.sessionCloseEvent(terminal)
            ),
            vscode.window.onDidStartTerminalShellExecution(
                async e => this.commandStartEvent(e)
            ),
            vscode.window.onDidEndTerminalShellExecution(
                async e => this.commandEndEvent(e)
            ),
            vscode.window.onDidWriteTerminalData(
                async e => this.terminalDataWriteEvent(e)
            )
        );
    }

    async sessionOpenEvent(terminal:  vscode.Terminal) {
        const sessionHandler = new SessionHandler(this);
        sessionHandler.handleSessionOpen(terminal);
    }

    async sessionCloseEvent(terminal:  vscode.Terminal) {
        const sessionHandler = new SessionHandler(this);
        sessionHandler.handleSessionClose(terminal);
    }

    async terminalDataWriteEvent(e:  vscode.TerminalDataWriteEvent) {
        TerminalSessionManager.pushDataBufferExcludingOpening(e.terminal, e.data);
    }

    async commandStartEvent(e: vscode.TerminalShellExecutionStartEvent) {
        const commandHandler = new CommandHandler(this);
        commandHandler.commandStartHandler(e);
    }

    async commandEndEvent(e: vscode.TerminalShellExecutionStartEvent) {
        const commandHandler = new CommandHandler(this);
        commandHandler.commandEndHandler(e);
    }
}
                                                        