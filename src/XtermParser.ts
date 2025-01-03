import * as vscode from 'vscode';
import { Terminal } from 'xterm-headless';
import { TerminalSessionManager } from './TerminalSessionManager';
import { Util } from './Util';

export class XtermParser {
    private static instance: XtermParser;
    private terminal: Terminal;

    private constructor() {
        this.terminal = new Terminal({
            cols: 200, rows: 24 ,
            allowProposedApi: true
        });
    }

    public static getInstance(): XtermParser {
        const activeTerminal = vscode.window.activeTerminal;
        if (!activeTerminal) {
            return new XtermParser();
        }
        let xtermParser = TerminalSessionManager.getXtermParser(activeTerminal);
        if (xtermParser) { return xtermParser; }

        xtermParser = new XtermParser();
        TerminalSessionManager.setXtermParser(activeTerminal, xtermParser);
        return xtermParser;
    }

    public async parseTerminalBuffer(buffer: string, trimEmptyRow: boolean, delay: number = 10): Promise<string> {
        return new Promise((resolve) => {
            this.terminal.clear();
            this.terminal.reset(); // Resets the terminal
            this.terminal.write(buffer);

            setTimeout(() => {
                let cleanedOutput = '';
                const activeBuffer = this.terminal.buffer.active;
                // Iterate over each line of the terminal buffer
                for (let i = 0; i < activeBuffer.length; i++) {
                    const line = activeBuffer.getLine(i)?.translateToString(true);
                    if (trimEmptyRow) {
                        if (line) {cleanedOutput += line + '\n';}
                    } else {
                        cleanedOutput += line + '\n';
                    }
                }
                cleanedOutput = cleanedOutput.replace(/(\n)+$/, '\n');
                cleanedOutput = Util.removeLeadingLineWithWhitespace(cleanedOutput);
                resolve(cleanedOutput);
            }, delay);
        });
    }
}
