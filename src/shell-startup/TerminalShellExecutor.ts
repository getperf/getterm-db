import * as vscode from "vscode";
import { Logger } from "../Logger";
import { ShellStartupConfigurator } from "./ShellStartupConfigurator";
import { TerminalPromptWatcher } from "./TerminalPromptWatcher";

export class TerminalShellExecutor {
    // private static remotePath = ShellStartupConfigurator.remotePath;

    static nodeCounts: { [key: string]: number } = {};
    
    static getTerminalName(node: string): string {
        if (this.nodeCounts[node] === undefined) {
            this.nodeCounts[node] = 0; // 初回作成
            return `SSH: ${node}`;
        }
        this.nodeCounts[node]++;
        return `SSH: ${node} - ${this.nodeCounts[node]}`;
    }

    private static async authenticateTerminal(terminal: vscode.Terminal): Promise<boolean> {
        let retryLogin = 3;
        while (retryLogin > 0) {
            const prompt = await TerminalPromptWatcher.waitMessage(terminal, /[$#%]|password:$/);
            console.log("WAIT MESSAGE RESULT:", prompt);
            
            if (prompt === 'password:') {
                const password = await vscode.window.showInputBox({
                    prompt: "Enter your SSH password",
                    password: true,
                });
                if (password) {
                    terminal.sendText(password);
                } else {
                    return false;
                }
            } else if (prompt && /[#$%]$/.test(prompt)) {
                return true;
            }
            retryLogin--;
        }
        return false;
    }
    
    public static async openTerminalWithProfile(node: any): Promise<vscode.Terminal | undefined> {
        if (!node || !node.label) {
            vscode.window.showErrorMessage("プロファイルが選択されていません。");
            return;
        }

        const nodeLabel = node.label;
        const terminalName = TerminalShellExecutor.getTerminalName(node.label);
        Logger.info(`open terminal profile : ${nodeLabel}`);
        const terminalOptions: vscode.TerminalOptions = {
            name: terminalName,
            shellPath: "ssh",
            shellArgs: [nodeLabel],
        };
        const terminal = await vscode.window.createTerminal(terminalOptions);
        TerminalPromptWatcher.registerTerminal(terminal);
        terminal.show();

        try {
            const signedIn = await this.authenticateTerminal(terminal);
            if (!signedIn) {
                vscode.window.showErrorMessage(`SSH ログインに失敗しました。`);
                return;
            }
            
            if (TerminalPromptWatcher.getShellIntegrationStatus(terminal)) {
                Logger.info(`open terminal, shell integration already activated`);
                return terminal;
            }
            const configurator = new ShellStartupConfigurator();
            // const isok = await ShellStartupConfigurator.transferShellIntegrationScript(terminal);
            const isok = await configurator.transferShellIntegrationScript(terminal);
            Logger.info(`open terminal, shell integration activate : ${isok}`);
            if (!isok) {
                vscode.window
                    .showErrorMessage(`シェル統合有効化スクリプトを実行できません。
                    手動でスクリプトを実行してください。詳細は ～ を参照してください`);
                return terminal;
            } else {
                terminal.sendText(`source "${configurator.remotePath}"`);
            }
            const shellConfigFile = configurator.getShellConfigFilePath();
            vscode.window.showInformationMessage(
                `シェル統合を永続化するには、${shellConfigFile} に次の行を追加してください:\n\n` +
                `source "\${HOME}/.getterm/vscode-shell-integration.sh"\n\n` +
                `（ターミナルで "vi ~/${shellConfigFile}" と入力して編集できます。`,
            );
            Logger.info(`open terminal, end`);
            return terminal;
        } finally {
            TerminalPromptWatcher.unregisterTerminal(terminal);
        }
    }
}
