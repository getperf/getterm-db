import * as vscode from "vscode";
import { Logger } from "../Logger";
import { ShellStartupConfigurator } from "./ShellStartupConfigurator";
import { TerminalPromptWatcher } from "./TerminalPromptWatcher";

export class TerminalShellExecutor {
    // private context: vscode.ExtensionContext;
    private static remotePath = ShellStartupConfigurator.remotePath;

    // constructor(context: vscode.ExtensionContext) {
    //     this.context = context;
    //     this.registerCommands();
    // }

    // private registerCommands() {
    //     this.context.subscriptions.push(
    //         vscode.commands.registerCommand(
    //             "getterm-ssh.showRemoteSSHView",
    //             () => {
    //                 Logger.info("show remove ssh view command invoked");
    //                 vscode.commands.executeCommand("workbench.view.remote");
    //             },
    //         ),
    //         vscode.commands.registerCommand(
    //             "getterm-ssh.openTerminalWithProfile",
    //             this.openTerminalWithProfile,
    //             this,
    //         ),
    //     );
    // }

    static nodeCounts: { [key: string]: number } = {};
    
    static getTerminalName(node: string): string {
        if (this.nodeCounts[node] === undefined) {
            this.nodeCounts[node] = 0; // 初回作成
            return `SSH: ${node}`;
        }
        this.nodeCounts[node]++;
        return `SSH: ${node} - ${this.nodeCounts[node]}`;
    }
    
    public static async openTerminalWithProfile(node: any): Promise<vscode.Terminal | undefined> {
        if (!node || !node.label) {
            vscode.window.showErrorMessage("プロファイルが選択されていません。");
            return;
        }

        const nodeLabel = node.label;
        const terminalName = TerminalShellExecutor.getTerminalName(node.label);
        Logger.info(`open terminal profile : ${nodeLabel}`);
        console.log("open terminal profile");
        const terminalOptions: vscode.TerminalOptions = {
            name: terminalName,
            shellPath: "ssh",
            shellArgs: [nodeLabel],
        };
        const terminal = await vscode.window.createTerminal(terminalOptions);
        TerminalPromptWatcher.registerTerminal(terminal);
        terminal.show();

        let signedIn = false;
        let retryLogin = 3;
        while (retryLogin > 0) {
            const prompt = await TerminalPromptWatcher.waitMessage(terminal, /[#$]|password:$/);
            console.log("WAIT MESSAGE RESULT:", prompt);
            if (prompt === 'password:') {
                const password = await vscode.window.showInputBox({
                    prompt: "Enter your SSH password",
                    password: true,
                });
                if (password) {
                    terminal.sendText(password);
                } else {
                    break;
                }
            } else if (prompt === '$') {
                signedIn = true;
                break;
            }
            retryLogin--;
        }
        console.log("SIGNED IN:", signedIn);
        if (!signedIn) {
            vscode.window.showErrorMessage(`SSH ログインに失敗しました。`);
            return;
        }
        const isok = await ShellStartupConfigurator .transferShellIntegrationScript(terminal);
        Logger.info(`open terminal, shell integration activate : ${isok}`);
        if (!isok) {
            vscode.window
                .showErrorMessage(`シェル統合有効化スクリプトを実行できません。
                手動でスクリプトを実行してください。詳細は ～ を参照してください`);
            return;
        } else {
            terminal.sendText(`source "${this.remotePath}"`);
        }
        Logger.info(`open terminal, end`);
        return terminal;
    }
}
