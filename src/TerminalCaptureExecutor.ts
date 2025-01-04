import * as vscode from 'vscode';
import { TerminalSessionManager } from './TerminalSessionManager';
import { Session } from './model/Session';
import { Logger } from './Logger';
import { Config } from './Config';
import { TerminalSessionMode } from './TerminalSession';

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
            vscode.commands.registerCommand('getterm-db.captureTerminal', 
                this.captureTerminal
            ),
        );
    }
    private async captureTerminal() {
        const terminal = vscode.window.activeTerminal;
        if (!terminal) {
            vscode.window.showErrorMessage("No active terminal found.");
            return;
        }
        vscode.window.showInformationMessage(`端末キャプチャー: ${terminal.name}`);
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
        // const config = Config.getInstance();
        // config.set('terminalProfiles', [remoteProfile]);
        Logger.info(`open terminal, save profile : ${remoteProfile}`);
        const sessionId = await Session.create(remoteProfile, 'Capture from existing terminal', [], '', '');
        const session = await Session.getById(sessionId);
        session.terminalSessionMode = TerminalSessionMode.Capturing;
        console.log("セッション履歴登録：", session);
        TerminalSessionManager.setSessionId(terminal, sessionId);
        Logger.info(`open terminal, regist session id : ${sessionId}`);
        Logger.info(`open terminal, end`);
    }
}
