import * as vscode from 'vscode';
import { Session } from './model/Session';
import { TerminalNotebookController } from './NotebookController';
import { ConsoleEventProvider } from './ConsoleEventProvider';
import { TerminalSessionMode } from './TerminalSession';
import { NotebookSessionWriter } from './NotebookSessionWriter';
import { TerminalSessionManager } from './TerminalSessionManager';

export class SessionHandler {
    private notebookController : TerminalNotebookController;
    // private sessionId : number | undefined;

    constructor(consoleEventProvider: ConsoleEventProvider) {
        this.notebookController = consoleEventProvider.notebookController;
    }

    handleSessionOpen(terminal: vscode.Terminal) {
        console.log(`Session started for terminal: ${terminal.name}`);
        // vscode.window.showInformationMessage(`Session started for terminal: ${terminal.name}`);
        
        // Additional setup for the terminal session can be performed here
    }

    handleSessionClose(terminal: vscode.Terminal) {
        console.log(`Session ended for terminal: ${terminal.name}`);
        const session = TerminalSessionManager.getSession(terminal);
        if (!session) {
            console.info("セッションを取得できませんでした : ", session);
            return;
        }
        session.terminalSessionMode = TerminalSessionMode.Close;
        const sessionName = session.sessionName || 'unkown session';
        NotebookSessionWriter.appendSessionClosedCell(session);
        Session.updateEnd(session.sessionId, new Date());
        // Perform additional cleanup or session logging here
        // Example: remove session data from storage, free up resources, etc.
    }

}
