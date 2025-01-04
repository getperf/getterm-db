import * as vscode from 'vscode';
import { TerminalSessionManager } from './TerminalSessionManager';
import { NotebookSessionWriter } from './NotebookSessionWriter';
import { TerminalSessionMode } from './TerminalSession';
import { Session } from './model/Session';
import { Logger } from './Logger';

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
    
    private getAllOpenTerminals() : Map<string, vscode.Terminal> {
        const terminals = vscode.window.terminals;
        const terminalMap = new Map<string, vscode.Terminal>();
        terminals.forEach((terminal) => {
            terminalMap.set(terminal.name, terminal);
        });
        return terminalMap;
    }

    private async selectOpenTerminals() : Promise<vscode.Terminal | undefined> {
        const terminals = this.getAllOpenTerminals();
        console.log("terminalNames: ", terminals);
        const terminalNames = Array.from(terminals.keys());
        const selectedTerminalName = await vscode.window.showQuickPick(terminalNames, {
            placeHolder: 'Select a terminal'
        });
    
        if (selectedTerminalName) {
            const selectedTerminal = terminals.get(selectedTerminalName);
            if (selectedTerminal) {
                return selectedTerminal;
            }
        }
    
        // if (!terminals || terminals.length === 0) {
        //     vscode.window.showInformationMessage('現在開いているターミナルはありません。');
        //     return;
        // }
  
        // // ターミナルリストを表示
        // const terminalNames = Array.from(terminals.keys());
        // console.log("terminalNames: ", JSON.stringify(terminalNames));
        // const selected = await vscode.window.showQuickPick(terminalNames, {
        //     placeHolder: '開いているターミナルを選択してください',
        // });
        // if (selected) {
        //     vscode.window.showInformationMessage(`選択されたターミナル: ${selected}`);
        //     return selected;
        // }
        return ;
    }

    private async selectSession() {
        const terminal = await this.selectOpenTerminals();
        console.log("terminal: ", terminal?.name);
        if (!terminal) {
            vscode.window.showInformationMessage('No terminal selected.');
            return;
        }
        let selectedSession = TerminalSessionManager.get(terminal);
        if (!selectedSession) {
            selectedSession = await TerminalSessionManager.create(terminal);
        }
        // const sessions = await this.getAvailableSessions();
        // const selectedSession = await vscode.window.showQuickPick(sessions, {
        //     placeHolder: 'Select a session',
        // });

        if (selectedSession) {   
            const notebookEditor = vscode.window.activeNotebookEditor;
            // Remove current terminal notebook from session.
            const currentTerminal = TerminalSessionManager.findTerminalByNotebookEditor(notebookEditor);
            if (currentTerminal) {
                TerminalSessionManager.setNotebookEditor(currentTerminal, undefined);
            }
            vscode.window.showInformationMessage(`You selected: ${selectedSession}`);
            // const session = TerminalSessionManager.findByName(selectedSession);
            // const terminal = TerminalSessionManager.findTerminalByName(selectedSession);
            if (notebookEditor) {
            // if (session && terminal && notebookEditor) {
                vscode.window.showInformationMessage(`You selected: ${selectedSession}`);
                TerminalSessionManager.setNotebookEditor(terminal, notebookEditor);
                // NotebookSessionWriter.appendSessionStartCell(session);
                NotebookSessionWriter.appendSessionStartCell(selectedSession);
                TerminalNotebookSessionPicker.showExplorerAndOutline();
            }

        }
    }

    static showExplorerAndOutline() {
        vscode.commands.executeCommand('outline.focus');
        vscode.commands.executeCommand('workbench.view.explorer');
    }

}
