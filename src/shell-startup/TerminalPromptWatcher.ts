import * as vscode from "vscode";
import { TerminalBufferParser } from "./TerminalBufferParser";

export class TerminalPromptWatcher {
    private static terminalBuffers: Map<vscode.Terminal, string> = new Map();
    private static listeners: Map<vscode.Terminal, vscode.Disposable> = new Map();

    /**
     * 指定した端末の出力をバッファリングする
     * @param terminal 監視する端末
     */
    static registerTerminal(terminal: vscode.Terminal) {
        this.terminalBuffers.set(terminal, "");

        const disposable = vscode.window.onDidWriteTerminalData((e) => {
            if (e.terminal === terminal) {
                const existingBuffer = this.terminalBuffers.get(terminal) || "";
                this.terminalBuffers.set(terminal, existingBuffer + e.data);
            }
        });

        this.listeners.set(terminal, disposable);
    }

    /**
     * バッファをクリア
     * @param terminal 対象の端末
     */
    static clearBuffer(terminal: vscode.Terminal) {
        this.terminalBuffers.set(terminal, "");
    }

    /**
     * 指定した正規表現が最後尾に出るまで待機
     * @param terminal 監視する端末
     * @param pattern 検出するキーワード（文字列または正規表現）
     * @param timeout タイムアウト時間（ミリ秒）
     * @returns マッチした文字列、または `null`（タイムアウト時）
     */
    static async waitMessage(terminal: vscode.Terminal, pattern: string | RegExp, timeout: number = 30000): Promise<string | null> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const regex = typeof pattern === "string" ? new RegExp(`${pattern}$`) : pattern;
            console.log("REGEX:", regex);

            const interval = setInterval(async () => {
                const rawBuffer = this.terminalBuffers.get(terminal) || "";
                const buffer = await TerminalBufferParser.parse(rawBuffer, true);
                console.log("BUFFER:", buffer);
                const match = buffer.trim().match(regex);

                if (match) {
                    clearInterval(interval);
                    resolve(match[1] || match[0]); // キャプチャがあれば返す
                }

                if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    resolve(null);
                }
            }, 500);
        });
    }

    /**
     * 端末の監視を解除
     * @param terminal 対象の端末
     */
    static unregisterTerminal(terminal: vscode.Terminal) {
        this.listeners.get(terminal)?.dispose();
        this.listeners.delete(terminal);
        this.terminalBuffers.delete(terminal);
    }
}

