import * as vscode from 'vscode';
import { TerminalSessionManager } from './terminal_session_manager';
import { Session } from './model/sessions';
import { Logger } from './logger';
import { Config } from './config';
import { TerminalSessionMode } from './terminal_session';

export class TerminalCaptureExecutor {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
    }

    private registerCommands() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('getterm-db.startTerminalCapture', 
                this.startTerminalCapture
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
        Logger.info(`open terminal profile : ${remoteProfile}`);
        console.log(terminal);
        const shellIntegration = terminal.shellIntegration;
        console.log("shell integration : ", shellIntegration);
        if (!shellIntegration) {
            vscode.window.showErrorMessage("シェル統合が有効化されてません");
            return;
        }
        const config = Config.getInstance();
        config.set('terminalProfiles', [remoteProfile]);
        Logger.info(`open terminal, save profile : ${remoteProfile}`);
        const sessionId = await Session.create(remoteProfile, 'Capture from existing terminal', [], '', '');
        const session = await Session.getById(sessionId);
        session.terminalSessionMode = TerminalSessionMode.Captured;
        console.log("セッション履歴登録：", session);
        TerminalSessionManager.setSessionId(terminal, sessionId);
        Logger.info(`open terminal, regist session id : ${sessionId}`);
        Logger.info(`open terminal, end`);
    }
}
