import * as vscode from 'vscode';
import { TerminalSessionManager } from './terminal_session_manager';
import { NotebookSessionWriter } from './notebook_session_writer';
import { TerminalSessionMode } from './terminal_session';

export class TerminalNotebookSessionPicker {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
    }

    async getAvailableSessions(): Promise<string[]> {
        return TerminalSessionManager.getAllSessionLabels();
    }
    
    private registerCommands() {
		this.context.subscriptions.push(
            vscode.commands.registerCommand('getterm-db.selectSession', async () => {
                const sessions = await this.getAvailableSessions();
                const selectedSession = await vscode.window.showQuickPick(sessions, {
                    placeHolder: 'Select a session',
                });
    
                if (selectedSession) {   
                    const notebookEditor = vscode.window.activeNotebookEditor;
                    // Remove current terminal notebook from session.
                    const currentTerminal = TerminalSessionManager.findTerminalByNotebookEditor(notebookEditor);
                    if (currentTerminal) {
                        TerminalSessionManager.setNotebookEditor(currentTerminal, undefined);
                    }
                    vscode.window.showInformationMessage(`You selected: ${selectedSession}`);
                    const terminal = TerminalSessionManager.findTerminalByName(selectedSession);
                    if (terminal && notebookEditor) {
                        vscode.window.showInformationMessage(`You selected: ${selectedSession}`);
                        TerminalSessionManager.setNotebookEditor(terminal, notebookEditor);
                    }
                    NotebookSessionWriter.appendSessionTitleCell(selectedSession);
                }
            }),
            vscode.commands.registerCommand('getterm-db.stopCapture', async () => {
                vscode.window.showInformationMessage(`You selected: Stop Capture`);
                const notebookEditor = vscode.window.activeNotebookEditor;
                const currentTerminal = TerminalSessionManager.findTerminalByNotebookEditor(notebookEditor);
                if (currentTerminal) {
                    const session = TerminalSessionManager.get(currentTerminal);
                    if (session){
                        session.terminalSessionMode = TerminalSessionMode.CaptureStopped;
                    }
                }
            }),
        );
    }

    // private async selectSessions() {
    //     const sessions = await this.getAvailableSessions();
    //     const selectedSession = await vscode.window.showQuickPick(sessions, {
    //         placeHolder: 'Select a session',
    //     });

    //     if (selectedSession) {   
    //         const notebookEditor = vscode.window.activeNotebookEditor;
    //         // Remove current terminal notebook from session.
    //         const currentTerminal = TerminalSessionManager.findTerminalByNotebookEditor(notebookEditor);
    //         if (currentTerminal) {
    //             TerminalSessionManager.setNotebookEditor(currentTerminal, undefined);
    //         }
    //         vscode.window.showInformationMessage(`You selected: ${selectedSession}`);
    //         const terminal = TerminalSessionManager.findTerminalByName(selectedSession);
    //         if (terminal && notebookEditor) {
    //             vscode.window.showInformationMessage(`You selected: ${selectedSession}`);
    //             TerminalSessionManager.setNotebookEditor(terminal, notebookEditor);
    //         }

    //         // Handle the session selection (e.g., load data, start execution, etc.)
    //     }
    // }
}
