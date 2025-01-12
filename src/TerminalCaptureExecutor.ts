import * as vscode from "vscode";
import { Session } from "./model/Session";
import { Logger } from "./Logger";
import { TerminalSessionMode } from "./TerminalSession";
import { TerminalSessionManager } from "./TerminalSessionManager";

export class TerminalCaptureExecutor {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
    }

    private registerCommands() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                "getterm-db.startTerminalCapture",
                this.startTerminalCapture,
            ),
        );
    }

    private async startTerminalCapture() {
        const terminal = vscode.window.activeTerminal;
        if (!terminal) {
            vscode.window.showErrorMessage("No active terminal found.");
            return;
        }
        const remoteProfile = terminal.name;
        Logger.info(`capture terminal, profile : ${remoteProfile}`);
        console.log(terminal);
        if (!terminal.shellIntegration) {
            vscode.window.showErrorMessage("シェル統合が有効化されてません");
        }

        const session = await TerminalSessionManager.getSessionOrCreate(terminal);
        session.terminalSessionMode = TerminalSessionMode.Capturing;
        Logger.info(`capture terminal, regist session id : ${session.sessionId}`);
        Logger.info(`capture terminal, end`);
    }
}
