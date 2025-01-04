import * as cp from 'child_process';
import * as vscode from 'vscode';
import { TerminalSessionManager } from './TerminalSessionManager';
import { Session } from './model/Session';
import { Logger } from './Logger';
// import { Config } from './Config';

export class PowerShellExecutor {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
    }

    private registerCommands() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('getterm-db.openPowerShellWithProfile', 
                this.openPowerShellWithProfile
            ),
        );
    }

    private async openPowerShellWithProfile() {
        const remoteProfile = 'powershell';
        Logger.info(`open terminal profile : ${remoteProfile}`);
        // await vscode.commands.executeCommand(
        //     'workbench.action.terminal.newWithProfile', 
        //     "PowerShell (Default)"
        // );

        // Create a profile object for PowerShell (Default)
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
        const terminalOptions: vscode.TerminalOptions = {
            name: "PowerShell (Default)",
            shellPath: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", // Path to PowerShell
            cwd: workspaceRoot
        };

        // Open a new terminal with the specified profile options
        const terminal = vscode.window.createTerminal(terminalOptions);
        terminal.show();

        // const config = Config.getInstance();
        // config.set('terminalProfiles', [remoteProfile]);
        Logger.info(`open terminal, save profile : ${remoteProfile}`);
        const sessionId = await Session.create(remoteProfile, 'powershell', [], '', '');
        const session = await Session.getById(sessionId);
        console.log("セッション履歴登録：", session);
        TerminalSessionManager.setSessionId(terminal, sessionId);
        Logger.info(`open terminal, regist session id : ${sessionId}`);
        Logger.info(`open terminal, end`);
    }
}
