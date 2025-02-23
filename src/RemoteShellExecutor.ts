import * as cp from "child_process";
import * as vscode from "vscode";
import { Session } from "./model/Session";
import { Logger } from "./Logger";
import { DatabaseManager } from "./DatabaseManager";
import { TerminalSessionManager } from "./TerminalSessionManager";
import { TerminalShellExecutor } from "./shell-startup/TerminalShellExecutor";
import { ShellStartupConfigurator, ShellType } from "./shell-startup/ShellStartupConfigurator";

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
                "getterm-db.loadShellIntegrationScript", async () => {
                    const shellType = await ShellStartupConfigurator.pickShellType();
                    const configurator = new ShellStartupConfigurator(shellType);
                    configurator.loadShellIntegrationScript();
                }
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
            vscode.commands.registerCommand(
                'getterm-db.maximizeTerminalPanel', async () => {
                await vscode.commands.executeCommand('workbench.action.toggleMaximizedPanel');
            }),
        );
    }

    private async openTerminalWithProfileAndCreateNotebook(node: any) {
        if (!node || !node.label) {
            vscode.window.showErrorMessage(
                "プロファイルが選択されていません。",
            );
            return;
        }
        const terminal = await this.openTerminalWithProfile(node);
        await vscode.commands.executeCommand(
            "getterm-db.createNewTerminalNotebook",
        );
    }

    private async openTerminalWithProfile(node: any) : Promise<vscode.Terminal | undefined> {
        if (!node || !node.label) {
            vscode.window.showErrorMessage("プロファイルが選択されていません。");
            return;
        }
        await DatabaseManager.initialize();
        TerminalSessionManager.initializeInstance();
        const terminal = await TerminalShellExecutor.openTerminalWithProfile(node);
        if (!terminal) {
            vscode.window.showErrorMessage("端末初期化に失敗しました");
            return;
        }
        const terminalOptions: vscode.TerminalOptions = {
            name: terminal.name,
            shellPath: "ssh",
            shellArgs: [node.label],
        };
        console.log("open terminal profile:", terminalOptions);
        Logger.info(`open terminal, save profile : ${terminalOptions}`);
        const sessionId = await Session.createByTerminalOptions(terminalOptions);
        console.log("セッション履歴登録：", sessionId);
        TerminalSessionManager.create(terminal, sessionId);
        Logger.info(`open terminal, regist session id : ${sessionId}`);
        return terminal;
    }
}
