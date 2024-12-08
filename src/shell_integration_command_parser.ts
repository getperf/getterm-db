import { Util } from './util';
import { XtermParser } from './xterm_parser';

export class ParsedCommand {
    command = '';
    output = '';
    exitCode: number | null = null;
    cwd = '';
}

export class ShellIntegrationCommandParser {

    static async extractCommandText(buffer: string): Promise<string> {
        const xtermParser = XtermParser.getInstance();
        buffer = await xtermParser.parseTerminalBuffer(buffer);
        buffer = Util.removeLeadingLineWithWhitespace(buffer); // Fix CTRL-U
        return buffer;
    }

    static splitBufferByCommandSequence(buffer: string): { commandBuffer: string; outputBuffer: string } {
        const osc633CommandB = "\u001b]633;B\u0007";
        const osc633CommandC = "\u001b]633;C\u0007";
    
        const indexCommandC = buffer.lastIndexOf(osc633CommandC);
        if (indexCommandC === -1) {
            return {
                commandBuffer: buffer,
                outputBuffer: "",
            };
        }
        let commandBuffer = buffer.slice(0, indexCommandC);
        const outputBuffer = buffer.slice(indexCommandC + osc633CommandC.length);
    
        const indexCommandB = commandBuffer.lastIndexOf(osc633CommandB);
        if  (indexCommandB !== -1) {
            commandBuffer = commandBuffer.slice(indexCommandB + osc633CommandB.length);
        }
        return {
            commandBuffer,
            outputBuffer,
        };
    }

    static selectCompleteCommand(startCommandText: string | undefined, eCommandText: string): string {
        if (!startCommandText) {return eCommandText;}
        if (!eCommandText) {return startCommandText;}
        // startCommandText にパイプが含まれる場合はそれを選択
        if (startCommandText.includes("|")) {
            return startCommandText;
        }
        return eCommandText;
    }
    
    static async parse(buffer: string): Promise<ParsedCommand> {
        // Split buffer into command and output parts using C-command delimiter
        const parsedCommand = new ParsedCommand();
        const parts = this.splitBufferByCommandSequence(buffer);
        const commandText = await this.extractCommandText(parts.commandBuffer);
        parsedCommand.command = commandText;

        const oscRegex = /\x1B\]633;([A-ZP])([^\x07]*)?\x07/g;
        let lastIndex = 0;
        let match;
        let eCommandText = '';
        while ((match = oscRegex.exec(parts.commandBuffer + parts.outputBuffer)) !== null) {
            const oscType = match[1];  // A, B, C, D, E, P
            const oscData = match[2] || '';  // The oscData after the ; in the sequence
            lastIndex = oscRegex.lastIndex;
            switch (oscType) {
                case 'C':  // Command result starts
                case 'B':  // Command result starts
                    break;
                case 'D':  // Exit code
                    const exitCodeString = oscData.split(';')[1];  // Extract exit code from the format `;0`
                    if (exitCodeString){
                        parsedCommand.exitCode = parseInt(exitCodeString, 10);  // Capture the exit code
                    }
                    break;
                case 'E':  // Command text
                    eCommandText = oscData.split(';')[1];
                    if (eCommandText){
                        console.log("E COMMAND:", eCommandText);
                    }
                    break;
                case 'P':  // Current working directory
                    parsedCommand.cwd = oscData.split('=')[1] || '';  // Extract cwd from the format `Cwd=...`
                    break;
                default:
                    break;
            }
        }
        parsedCommand.command = this.selectCompleteCommand(commandText, eCommandText);
        return parsedCommand;
    }
}
