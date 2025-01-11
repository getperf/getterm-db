import * as cp from "child_process";
import * as vscode from "vscode";
import { Session } from "./model/Session";
import { Logger } from "./Logger";
import { DatabaseManager } from "./DatabaseManager";
import { TerminalSessionManager } from "./TerminalSessionManager";

export class RemoteShellExecutor {
    private context: vscode.ExtensionContext;
    private remotePath = "/tmp/vscode-shell-integration.sh";

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
    }

    private registerCommands() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                "getterm-db.showRemoteSSHView",
                () => {
                    Logger.info("show remove ssh view command invoked");
                    vscode.commands.executeCommand("workbench.view.remote");
                },
            ),
            vscode.commands.registerCommand(
                "getterm-db.openTerminalWithProfile",
                this.openTerminalWithProfile,
                this,
            ),
            vscode.commands.registerCommand(
                "getterm-db.openTerminalWithProfileAndCreateNotebook",
                this.openTerminalWithProfileAndCreateNotebook,
                this,
            ),
        );
    }

    private async copyShellIntegrationScript(
        remoteProfile: string,
    ): Promise<boolean> {
        try {
            const getScriptCmd =
                "code-insiders --locate-shell-integration-path bash";
            const shellIntegrationPath = cp
                .execSync(getScriptCmd)
                .toString()
                .trim();
            Logger.info(
                `shell integration script path ：${shellIntegrationPath}`,
            );
            if (!shellIntegrationPath) {
                throw new Error(`faild ${getScriptCmd}`);
            }
            const scpCommand = `scp "${shellIntegrationPath}" ${remoteProfile}:${this.remotePath}`;
            Logger.info(`shell integration script copy :${scpCommand}`);
            const ScpCommandTimeout = 5000;
            const rc = cp.execSync(scpCommand, { timeout: ScpCommandTimeout });
            Logger.info(`shell integration script copy result ：${rc}`);
        } catch (error) {
            Logger.error("Failed to locate shell integration path.");
            return false;
        }
        return true;
    }

    private async openTerminalWithProfileAndCreateNotebook(node: any) {
        if (!node || !node.label) {
            vscode.window.showErrorMessage(
                "プロファイルが選択されていません。",
            );
            return;
        }
        this.openTerminalWithProfile(node);
        vscode.window.showInformationMessage("セッション開始まで待ちます");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await vscode.commands.executeCommand(
            "getterm-db.createNewTerminalNotebook",
        );
        // const notebookController = new TerminalNotebookController();
        // notebookController.createNotebook();
    }

    static nodeCounts: { [key: string]: number } = {};
    
    static getTerminalName(node: string): string {
        if (this.nodeCounts[node] === undefined) {
            this.nodeCounts[node] = 0; // 初回作成
            return `SSH: ${node}`;
        }
        this.nodeCounts[node]++;
        return `SSH: ${node} - ${this.nodeCounts[node]}`;
    }
    
    private async openTerminalWithProfile(node: any) {
        if (!node || !node.label) {
            vscode.window.showErrorMessage(
                "プロファイルが選択されていません。",
            );
            return;
        }
        await DatabaseManager.initialize();
        TerminalSessionManager.initializeInstance();
        // console.log("initialize terminal session end");

        const nodeLabel = node.label;
        const terminalName = RemoteShellExecutor.getTerminalName(node.label);
        Logger.info(`open terminal profile : ${nodeLabel}`);
        console.log("open terminal profile");
        const terminalOptions: vscode.TerminalOptions = {
            name: terminalName,
            shellPath: "ssh",
            shellArgs: [nodeLabel],
        };
        const terminal = await vscode.window.createTerminal(terminalOptions);
        terminal.show();
        console.log("open terminal profile end:", terminal);

        // const config = Config.getInstance();
        // config.set('terminalProfiles', [remoteProfile]);
        Logger.info(`open terminal, save profile : ${nodeLabel}`);
        const sessionId = await Session.createByTerminalOptions(terminalOptions);
        console.log("セッション履歴登録：", sessionId);
        TerminalSessionManager.create(terminal, sessionId);
        // TerminalSessionManager.updateSession(terminal, "sessionId", sessionId);
        Logger.info(`open terminal, regist session id : ${sessionId}`);

        const isok = await this.copyShellIntegrationScript(nodeLabel);
        Logger.info(`open terminal, shell integration activate : ${isok}`);
        if (!isok) {
            vscode.window
                .showErrorMessage(`シェル統合有効化スクリプトを実行できません。
                手動でスクリプトを実行してください。詳細は ～ を参照してください`);
            return;
        }
        terminal.sendText(`source "${this.remotePath}"`);
        Logger.info(`open terminal, end`);
    }
}
