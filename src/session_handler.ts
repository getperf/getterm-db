import * as vscode from 'vscode';
import { Config } from './config';
import { initializeDatabase, Database } from './database';
import { Session } from './model/sessions';
import { Command } from './model/commands';
import { TerminalNotebookController } from './notebook_controller';
import { TerminalSessionManager } from './terminal_session_manager';
import { Util } from './util';
import { Logger } from './logger';
import { ConsoleEventProvider } from './console_event_provider';
import { TerminalSession, TerminalSessionMode } from './terminal_session';
import { NotebookSessionWriter } from './notebook_session_writer';

export class SessionHandler {
    private notebookController : TerminalNotebookController;
    // private sessionId : number | undefined;

    constructor(consoleEventProvider: ConsoleEventProvider) {
        this.notebookController = consoleEventProvider.notebookController;
    }

    handleSessionOpen(terminal: vscode.Terminal) {
        console.log(`Session started for terminal: ${terminal.name}`);
        vscode.window.showInformationMessage(`Session started for terminal: ${terminal.name}`);
        
        // Additional setup for the terminal session can be performed here
    }

    handleSessionClose(terminal: vscode.Terminal) {
        console.log(`Session ended for terminal: ${terminal.name}`);
        const session = TerminalSessionManager.get(terminal);
        if (!session) {
            console.info("セッションを取得できませんでした : ", session);
            return;
        }
        session.terminalSessionMode = TerminalSessionMode.Close;
        const sessionName = session.sessionName || 'unkown session';
        NotebookSessionWriter.appendSessionClosedCell(sessionName);
        // Perform additional cleanup or session logging here
        // Example: remove session data from storage, free up resources, etc.
    }

}
