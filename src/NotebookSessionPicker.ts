import * as vscode from 'vscode';
import { TerminalSessionManager } from './TerminalSessionManager';
import { NotebookSessionWriter } from './NotebookSessionWriter';
import { TerminalSessionMode } from './TerminalSession';

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
                await this.selectSession();
            }),
            vscode.commands.registerCommand('getterm-db.stopCapture', async () => {
                vscode.window.showInformationMessage(`You selected: Stop Capture`);
                const notebookEditor = vscode.window.activeNotebookEditor;
                const currentTerminal = TerminalSessionManager.findTerminalByNotebookEditor(notebookEditor);
                if (currentTerminal) {
                    const session = TerminalSessionManager.get(currentTerminal);
                    if (session){
                        session.terminalSessionMode = TerminalSessionMode.CaptureStop;
                    }
                }
            }),
        );
    }
    
    private async selectSession() {
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
            const session = TerminalSessionManager.findByName(selectedSession);
            const terminal = TerminalSessionManager.findTerminalByName(selectedSession);
            if (session && terminal && notebookEditor) {
                vscode.window.showInformationMessage(`You selected: ${selectedSession}`);
                TerminalSessionManager.setNotebookEditor(terminal, notebookEditor);
                NotebookSessionWriter.appendSessionStartCell(session);
                TerminalNotebookSessionPicker.showExplorerAndOutline();
            }

        }
    }

    static showExplorerAndOutline() {
        vscode.commands.executeCommand('outline.focus');
        vscode.commands.executeCommand('workbench.view.explorer');
    }

}
