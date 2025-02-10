import * as vscode from "vscode";
import { TerminalSessionManager } from "./TerminalSessionManager";
import { NotebookSessionWriter } from "./NotebookSessionWriter";
import { TerminalSessionMode } from "./TerminalSession";

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
            vscode.commands.registerCommand(
                "getterm-db.selectSession",
                async () => {
                    await this.selectSessionAndBindNotebook();
                },
            ),
            vscode.commands.registerCommand(
                "getterm-db.stopCapture",
                async () => {
                    vscode.window.showInformationMessage(
                        `You selected: Stop Capture`,
                    );
                    const notebookEditor = vscode.window.activeNotebookEditor;
                    const currentTerminal =
                        TerminalSessionManager.findTerminalByNotebookEditor(
                            notebookEditor,
                        );
                    if (currentTerminal) {
                        const session =
                            TerminalSessionManager.getSession(currentTerminal);
                        if (session) {
                            session.terminalSessionMode =
                                TerminalSessionMode.CaptureStop;
                        }
                    }
                },
            ),
        );
    }

    private getAllOpenTerminals(): Map<string, vscode.Terminal> {
        const terminals = vscode.window.terminals;
        const terminalMap = new Map<string, vscode.Terminal>();
        terminals.forEach((terminal) => {
            terminalMap.set(terminal.name, terminal);
        });
        return terminalMap;
    }

    private async selectOpenTerminals(): Promise<vscode.Terminal | undefined> {
        const terminals = this.getAllOpenTerminals();
        console.log("terminalNames: ", terminals);
        const terminalNames = Array.from(terminals.keys());
        const selectedTerminalName = await vscode.window.showQuickPick(
            terminalNames,
            {
                placeHolder: "Select a terminal",
            },
        );

        if (selectedTerminalName) {
            const selectedTerminal = terminals.get(selectedTerminalName);
            if (selectedTerminal) {
                return selectedTerminal;
            }
        }

        return;
    }

    public async selectSessionAndBindNotebook(terminal?: vscode.Terminal) {
        if (!terminal) {
            terminal = await this.selectOpenTerminals();
        }
        console.log("terminal: ", terminal?.name);
        if (!terminal) {
            vscode.window.showInformationMessage("No terminal selected.");
            return;
        }
        TerminalNotebookSessionPicker.bindNotebookToTerminal(terminal);
    }

    static async bindNotebookToTerminal(terminal : vscode.Terminal) {
        const selectedSession =
        await TerminalSessionManager.getSessionOrCreate(terminal);

        if (!selectedSession) {
            vscode.window.showInformationMessage("No session selected.");
            return;
        }

        const notebookEditor = vscode.window.activeNotebookEditor;
        // Remove current terminal notebook from session.
        const currentTerminal = TerminalSessionManager.findTerminalByNotebookEditor(
            notebookEditor,
        );
        if (currentTerminal) {
            selectedSession.notebookEditor = undefined;
            selectedSession.terminalSessionMode = TerminalSessionMode.CaptureStop;
        }
        vscode.window.showInformationMessage(
            `You selected: ${selectedSession.sessionName}`,
        );
        // Set notebook to current terminal session.
        if (notebookEditor) {
            selectedSession.notebookEditor = notebookEditor;
            selectedSession.terminalSessionMode = TerminalSessionMode.Capturing;
            NotebookSessionWriter.appendSessionStartCell(selectedSession);
            // TerminalNotebookSessionPicker.showExplorerAndOutline();
        }
        terminal.show(false);
    }

    static showExplorerAndOutline() {
        vscode.commands.executeCommand("outline.focus");
        vscode.commands.executeCommand("workbench.view.explorer");
    }
}
