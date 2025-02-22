import * as crypto from "crypto";
import * as fs from "fs";
import * as vscode from "vscode";
import { TerminalPromptWatcher } from "./TerminalPromptWatcher";
import { Logger } from "../Logger";

export enum ShellType {
    Bash = "bash",
    Zsh = "zsh",
    Fish = "fish"
}

export class ShellStartupConfigurator {
    public remotePath = "$HOME/.getterm/vscode-shell-integration.sh";
    private shellType: ShellType = ShellType.Bash;

    /**
     * シェルタイプを選択するメソッド
     * @returns Promise<ShellType | undefined> - 選択されたシェルタイプ
     */
    private async pickShellType(): Promise<ShellType | undefined> {
        const shellType = await vscode.window.showQuickPick(
            Object.values(ShellType),
            {
                placeHolder: "ログイン後に利用するシェルを選択してください。"
            }
        );
        return shellType as ShellType | undefined;
    }

    getShellConfigFilePath(): string {
        switch (this.shellType) {
            case ShellType.Bash:
                return '.bash_profile';
            case ShellType.Zsh:
                return '.zshrc';
            case ShellType.Fish:
                return '.config/fish/config.fish';
            default:
                throw new Error(`Unsupported shell type: ${this.shellType}`);
        }
    }
      
    /**
     * スクリプトの転送を行うメソッド
     * @param terminal - vscode.Terminal インスタンス
     * @returns Promise<boolean> - 成功/失敗
     */
    async transferShellIntegrationScript(terminal: vscode.Terminal, skipCheck: boolean = false): Promise<boolean> {
        try {
            const shellType = await this.pickShellType() ?? ShellType.Bash;
            if (!shellType) {
                vscode.window.showErrorMessage("シェルの選択がキャンセルされました。");
                return false;
            }
            this.shellType = this.shellType;
            const shellIntegrationPath = this.getShellIntegrationPath(shellType);
            if (!shellIntegrationPath) {
                throw new Error("Failed to locate shell integration path.");
            }
            const localScriptContent = fs.readFileSync(shellIntegrationPath, "utf-8");
            const localChecksum = crypto
                .createHash("sha256")
                .update(localScriptContent)
                .digest("hex");
            Logger.info(`Local checksum: ${localChecksum}`);

            if (skipCheck) {
                terminal.sendText(`mkdir -p "$HOME/.getterm"`);
                await this.transferScriptContent(terminal, localScriptContent);
                return true;
            }
            const command = `
                mkdir -p "$HOME/.getterm" &&
                if [ -f "${this.remotePath}"]; then
                    sha256sum ${this.remotePath} | awk '{print toupper("checksum:"), $1}';
                else
                    echo "file_not_found" | awk '{print toupper($0)}';
                fi
            `;
            terminal.sendText(command.replace(/\s+/g, " ").trim());
            const prompt = await TerminalPromptWatcher.waitMessage(terminal, /CHECKSUM: (.+)|FILE_NOT_FOUND/);
            Logger.info(`Remote checksum result: ${prompt}`);
            if (prompt === localChecksum) {
                vscode.window.showInformationMessage("Shell Integration script checksum matches.");
            } else {
                vscode.window.showInformationMessage("Checksum mismatch. Transferring Shell Integration script...");
                await this.transferScriptContent(terminal, localScriptContent);
            }

            return true;
        } catch (error) {
            vscode.window.showErrorMessage("Failed to transfer shell integration script.");
            console.error(error);
            return false;
        }
    }

    /**
     * スクリプトをリモート端末に転送する
     * @param terminal - vscode.Terminal インスタンス
     * @param scriptContent - スクリプト内容
     */
    private async transferScriptContent(
        terminal: vscode.Terminal,
        scriptContent: string,
    ): Promise<void> {
        const encodedScript = Buffer.from(scriptContent).toString("base64");

        terminal.sendText(`echo "${encodedScript}" | base64 -d > "${this.remotePath}"`);
        terminal.sendText(`chmod +x "${this.remotePath}"`);
        console.log("Shell integration script successfully transferred.");
    }

    /**
     * シェル統合スクリプトのパスを取得する
     * @returns スクリプトのパス
     */
    private getShellIntegrationPath(shellType: string = "bash"): string {
        const getScriptCmd = `code-insiders --locate-shell-integration-path ${shellType}`;
        try {
            return require("child_process").execSync(getScriptCmd).toString().trim();
        } catch (error) {
            console.error("Failed to execute command to locate shell integration path.", error);
            return "";
        }
    }

    public async loadShellIntegrationScript() {
        const terminal = vscode.window.activeTerminal;
        if (!terminal) {
            vscode.window.showErrorMessage("No active terminal found.");
            return;
        }
        await this.transferShellIntegrationScript(terminal, true);
        terminal.sendText(`source ${this.remotePath}`);
    }
}