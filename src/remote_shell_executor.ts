import * as cp from 'child_process';
import * as vscode from 'vscode';
import { TerminalSessionManager } from './terminal_session_manager';
import { Session } from './model/sessions';
import { Logger } from './logger';
import { Config } from './config';
import { TerminalNotebookController } from './notebook_controller';
import { Util } from './util';
import { WorkspaceManager } from './workspace_manager';
import { initializeDatabase } from './database';

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
            vscode.commands.registerCommand('getterm-db.openTerminalWithProfileAndCreateNotebook', 
                this.openTerminalWithProfileAndCreateNotebook, this
            ),
        );
    }

    private async copyShellIntegrationScript(remoteProfile:string) : Promise<boolean> {
        try {
            const getScriptCmd = 'code-insiders --locate-shell-integration-path bash';
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

    private async openTerminalWithProfileAndCreateNotebook(node: any) {
        if (!node || !node.label) {
            vscode.window.showErrorMessage('プロファイルが選択されていません。');
            return;
        }
        this.openTerminalWithProfile(node);
        vscode.window.showInformationMessage("セッション開始まで待ちます");
        await new Promise(resolve => setTimeout(resolve, 1000));

        await vscode.commands.executeCommand('getterm-db.createNewTerminalNotebook');
        // const notebookController = new TerminalNotebookController();
        // notebookController.createNotebook();
    }

    private async openTerminalWithProfile(node: any) {
        if (!node || !node.label) {
            vscode.window.showErrorMessage('プロファイルが選択されていません。');
            return;
        }
        console.log("open workspace start");
        const workspaceReady = await WorkspaceManager.ensureWorkspaceIsOpen();
        if (!workspaceReady) {
            vscode.window.showErrorMessage('ワークスペースが開いていません');
            return;
        }
        console.log("open workspace end");
        // await initializeDatabase();
        console.log("initialize database end");
        TerminalSessionManager.initializeInstance();
        console.log("initialize terminal session end");

        // if (!Util.checkWorkspaceOpened()) {
        //     vscode.window.showErrorMessage('ワークスペースが開いていません');
        //     return;
        // }
        const remoteProfile = node.label;
        Logger.info(`open terminal profile : ${remoteProfile}`);
        console.log("open terminal profile");
        const terminalOptions: vscode.TerminalOptions = {
            name: `SSH Capture: ${remoteProfile}`,
            shellPath: 'ssh',
            shellArgs: [remoteProfile] 
        };
        const terminal = await vscode.window.createTerminal(terminalOptions);
        terminal.show();
        console.log("open terminal profile end:", terminal);

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