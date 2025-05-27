import * as vscode from 'vscode';
// import { Terminal } from 'xterm-headless';
import { Terminal } from '@xterm/headless';

export class TerminalBufferParser {
    public static async parse(buffer: string, trimEmptyRow: boolean, delay: number = 10): Promise<string> {
        // const terminal = new Terminal();
        const terminal = new Terminal({
            cols: 200, rows: 24 ,
            allowProposedApi: true
        });

        return new Promise((resolve) => {
            terminal.clear();
            terminal.reset(); // Resets the terminal
            terminal.write(buffer);

            setTimeout(() => {
                let cleanedOutput = '';
                const activeBuffer = terminal.buffer.active;
                // Iterate over each line of the terminal buffer
                for (let i = 0; i < activeBuffer.length; i++) {
                    const line = activeBuffer.getLine(i)?.translateToString(true);
                    if (trimEmptyRow) {
                        if (line) {cleanedOutput += line + '\n';}
                    } else {
                        cleanedOutput += line + '\n';
                    }
                }
                cleanedOutput = cleanedOutput.replace(/(\n)+$/, '');
                resolve(cleanedOutput);
            }, delay);
        });
    }
}
