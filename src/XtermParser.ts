import * as vscode from "vscode";
import { Terminal } from "xterm-headless";
import { Util } from "./Util";
import { TerminalSessionManager } from "./TerminalSessionManager";

export interface ParserOptions {
    trimEmptyRow?: boolean;
    normalizeCRLF?: boolean;
    delay?: number;
    removeLeadingWhitespace?: boolean;
    passthrough?: boolean;
}

export class XtermParser {
    private static instance: XtermParser;
    private terminal: Terminal;

    private constructor() {
        this.terminal = new Terminal({
            cols: 1000,
            rows: 24,
            allowProposedApi: true,
        });
    }

    public static getInstance(): XtermParser {
        const activeTerminal = vscode.window.activeTerminal;
        if (!activeTerminal) {
            return new XtermParser();
        }
        let xtermParser =
            TerminalSessionManager.getSession(activeTerminal).xtermParser;
        if (xtermParser) {
            return xtermParser;
        }

        xtermParser = new XtermParser();
        TerminalSessionManager.updateSession(
            activeTerminal,
            "xtermParser",
            xtermParser,
        );
        return xtermParser;
    }

    public async parseTerminalBuffer(
        buffer: string,
        options: ParserOptions = {},
    ): Promise<string> {
        const { 
            trimEmptyRow = true, 
            normalizeCRLF = true,
            delay = 10, 
            removeLeadingWhitespace = true,
            passthrough = false, 
        } = options;

        // `\n` を `\n\r` に変換（すでに `\r` がある場合はスキップ）
        if (normalizeCRLF) {
            buffer = buffer.replace(/\n(?!\r)/g, "\n\r");
        }
        // passthrough オプションが有効な場合、xterm.js を使用せずそのまま返す
        if (passthrough) {return buffer; }

        // ターミナルを初期化し、バッファを書き込む
        this.terminal.clear();
        this.terminal.reset();
        this.terminal.write(buffer);

        // 指定された遅延時間だけ待機
        await new Promise((resolve) => setTimeout(resolve, delay));

        // ターミナルのバッファを取得して解析
        let cleanedOutput = "";
        const activeBuffer = this.terminal.buffer.active;

        for (let i = 0; i < activeBuffer.length; i++) {
            let line = activeBuffer.getLine(i)?.translateToString(true);
            // 空行を削除する場合
            if (trimEmptyRow) {
                if (line && line.trim() !== "") {
                    cleanedOutput += line + "\n";
                }
            } else {
                cleanedOutput += line + "\n";
            }
        }
        // エスケープされたセミコロン（\x3b）を元に戻す
        cleanedOutput = cleanedOutput.replace(/\\x3b/g, ";");

        // 末尾の改行を削除
        cleanedOutput = cleanedOutput.replace(/(\n)+$/, "\n");
        // 行頭の空白を削除する場合
        if (removeLeadingWhitespace) {
            cleanedOutput = Util.removeLeadingLineWithWhitespace(cleanedOutput);
        }

        return cleanedOutput;

        // return new Promise((resolve) => {
        //     this.terminal.clear();
        //     this.terminal.reset(); // Resets the terminal
        //     this.terminal.write(buffer);

        //     setTimeout(() => {
        //         let cleanedOutput = "";
        //         const activeBuffer = this.terminal.buffer.active;
        //         // Iterate over each line of the terminal buffer
        //         for (let i = 0; i < activeBuffer.length; i++) {
        //             let line = activeBuffer
        //                 .getLine(i)
        //                 ?.translateToString(true);
        //             if (line) {
        //                 // Convert escaped `\\x3b` to `;`
        //                 line = line.replace(/\\x3b/g, ";");
        //             }
        //             if (trimEmptyRow) {
        //                 if (line) {
        //                     cleanedOutput += line + "\n";
        //                 }
        //             } else {
        //                 cleanedOutput += line + "\n";
        //             }
        //         }
        //         cleanedOutput = cleanedOutput.replace(/(\n)+$/, "\n");
        //         if (removeLeadingWhitespace) {
        //             cleanedOutput =
        //                 Util.removeLeadingLineWithWhitespace(cleanedOutput);
        //         }
        //         resolve(cleanedOutput);
        //     }, delay);
        // });
    }
}
