import * as cp from 'child_process';
import * as vscode from 'vscode';
import { TerminalSessionManager } from './terminal_session_manager';
import { Session } from './model/sessions';
import { Logger } from './logger';
import { Config } from './config';

export class RemoteShellExecutor {
    private context: vscode.ExtensionContext;
    private  remotePath = '/tmp/vscode-shell-integration.sh';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
    }

    private registerCommands() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('getterm-db.showRemoteSSHView', () => {
                Logger.info("show remove ssh view command invoked");
                vscode.commands.executeCommand('workbench.view.remote');
            }),
            vscode.commands.registerCommand('getterm-db.openTerminalWithProfile', 
                this.openTerminalWithProfile, this
            ),
        );
    }

    private async copyShellIntegrationScript(remoteProfile:string) : Promise<boolean> {
        try {
            const getScriptCmd = 'code --locate-shell-integration-path bash';
            const shellIntegrationPath = cp.execSync(getScriptCmd).toString().trim();
            Logger.info(`shell integration script path ：${shellIntegrationPath}`);
            if (!shellIntegrationPath) {
                throw new Error(`faild ${getScriptCmd}`);
            }
            const scpCommand = `scp "${shellIntegrationPath}" ${remoteProfile}:${this.remotePath}`;
            Logger.info(`shell integration script copy :${scpCommand}`);
            const ScpCommandTimeout = 5000;
            const rc = cp.execSync(scpCommand, { timeout: ScpCommandTimeout });
            Logger.info(`shell integration script copy result ：${rc}`);
        } catch (error) {
            Logger.error('Failed to locate shell integration path.');
            return false;
        }
        return true;
    }

    private async openTerminalWithProfile(node: any) {
        if (!node || !node.label) {
            vscode.window.showErrorMessage('プロファイルが選択されていません。');
            return;
        }
        const remoteProfile = node.label;
        Logger.info(`open terminal profile : ${remoteProfile}`);
        const terminalOptions: vscode.TerminalOptions = {
            name: `SSH Capture: ${remoteProfile}`,
            shellPath: 'ssh',
            shellArgs: [remoteProfile] 
        };
        const terminal = await vscode.window.createTerminal(terminalOptions);
        terminal.show();

        const config = Config.getInstance();
        config.set('terminalProfiles', [remoteProfile]);
        Logger.info(`open terminal, save profile : ${remoteProfile}`);
        const sessionId = await Session.create(remoteProfile, 'ssh', [remoteProfile], '', '');
        const session = await Session.getById(sessionId);
        console.log("セッション履歴登録：", session);
        TerminalSessionManager.setSessionId(terminal, sessionId);
        Logger.info(`open terminal, regist session id : ${sessionId}`);

        const isok = await this.copyShellIntegrationScript(remoteProfile);
        Logger.info(`open terminal, shell integration activate : ${isok}`);
        if (!isok) {
            vscode.window.showErrorMessage(`シェル統合有効化スクリプトを実行できません。
                手動でスクリプトを実行してください。詳細は ～ を参照してください`);
            return;
        }
        terminal.sendText(`source "${this.remotePath}"`);
        Logger.info(`open terminal, end`);
    }
}