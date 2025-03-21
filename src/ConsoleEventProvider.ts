import * as vscode from "vscode";
import { TerminalNotebookController } from "./NotebookController";
import { Logger } from "./Logger";
import { CommandHandler } from "./CommandHandler";
import { SessionHandler } from "./SessionHandler";
import { TerminalSessionManager } from "./TerminalSessionManager";

export class ConsoleEventProvider {
    private context: vscode.ExtensionContext;
    notebookController: TerminalNotebookController;

    constructor(
        context: vscode.ExtensionContext,
        notebookController: TerminalNotebookController,
    ) {
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
            vscode.window.onDidOpenTerminal(async (terminal) =>
                this.sessionOpenEvent(terminal),
            ),
            vscode.window.onDidCloseTerminal(async (terminal) =>
                this.sessionCloseEvent(terminal),
            ),
            vscode.window.onDidStartTerminalShellExecution(async (e) =>
                this.commandStartEvent(e),
            ),
            vscode.window.onDidEndTerminalShellExecution(async (e) =>
                this.commandEndEvent(e),
            ),
            vscode.window.onDidWriteTerminalData(async (e) =>
                this.terminalDataWriteEvent(e),
            ),
        );
    }

    async sessionOpenEvent(terminal: vscode.Terminal) {
        const sessionHandler = new SessionHandler(this);
        sessionHandler.handleSessionOpen(terminal);
    }

    async sessionCloseEvent(terminal: vscode.Terminal) {
        const sessionHandler = new SessionHandler(this);
        sessionHandler.handleSessionClose(terminal);
    }

    async terminalDataWriteEvent(e: vscode.TerminalDataWriteEvent) {
        // TerminalSessionManager.pushDataBufferExcludingOpening(e.terminal, e.data);
        if (TerminalSessionManager.findSession(e.terminal)) {
            TerminalSessionManager.pushDataBuffer(e.terminal, e.data);
        }
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
