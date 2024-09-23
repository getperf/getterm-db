import { Terminal } from 'xterm-headless';

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
        if (!XtermParser.instance) {
            XtermParser.instance = new XtermParser();
        }
        return XtermParser.instance;
    }

    public async parseTerminalBuffer(buffer: string, delay: number = 10): Promise<string> {
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
                    if (line) {cleanedOutput += line + '\n';}
                }
                resolve(cleanedOutput.trim());
            }, delay);
        });
    }
}
