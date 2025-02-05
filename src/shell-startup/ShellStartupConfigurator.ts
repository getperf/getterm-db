import * as crypto from "crypto";
import * as fs from "fs";
import * as vscode from "vscode";
import { TerminalPromptWatcher } from "./TerminalPromptWatcher";
import { Logger } from "../Logger";

export class ShellStartupConfigurator  {
    public static remotePath = "$HOME/.getterm/vscode-shell-integration.sh";

    /**
     * スクリプトの転送を行うスタティックメソッド
     * @param terminal - vscode.Terminal インスタンス
     * @returns Promise<boolean> - 成功/失敗
     */
    static async transferShellIntegrationScript(terminal: vscode.Terminal): Promise<boolean> {
        try {
            const shellIntegrationPath = this.getShellIntegrationPath();
            if (!shellIntegrationPath) {
                throw new Error("Failed to locate shell integration path.");
            }
            const localScriptContent = fs.readFileSync(shellIntegrationPath, "utf-8");
            const localChecksum = crypto
                .createHash("sha256")
                .update(localScriptContent)
                .digest("hex");
            Logger.info(`Local checksum: ${localChecksum}`);

            const command = `
                mkdir -p "$HOME/.getterm" &&
                if [ -f "${this.remotePath}" ]; then
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
    private static async transferScriptContent(
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
    private static getShellIntegrationPath(): string {
        const getScriptCmd = "code-insiders --locate-shell-integration-path bash";
        try {
            return require("child_process").execSync(getScriptCmd).toString().trim();
        } catch (error) {
            console.error("Failed to execute command to locate shell integration path.", error);
            return "";
        }
    }
}