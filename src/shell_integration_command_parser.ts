import { Util } from './util';
import { XtermParser } from './xterm_parser';

export class ParsedCommand {
    command = '';
    output = '';
    exitCode: number | null = null;
    cwd = '';
}

export class ShellIntegrationCommandParser {

    static parseMultilineCommand(buffer: string): string {
        const lines = buffer.split(/\r?\n/);
        let command = lines[0].trim(); // 初期コマンドを1行目として開始

        // 正規表現でOSC633のF,Gコマンドと余分な「>」を検出
        const regex = /\x1B\]633;F\x07>\s*\x1B\]633;G\x07/g;
        command = command.replace(regex, "\\\n");
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            // OSC633 F,G コードを検知
            if (/\u001b]633;F\u0007> \u001b]633;G\u0007/.test(line)) {
                // OSCコードと '>' を削除
                const cleanedLine = line.replace(/\u001b]633;[FG]\u0007/g, "").replace(/^> /, "");
                // 抽出したコマンドに追記
                command += `\n${cleanedLine}`;
            } else {
                break;
            }
        }
        return command.trim();
    }

    static async extractCommandText(buffer: string): Promise<string> {
        const lines = this.parseMultilineCommand(buffer).split(/\n/);
        const xtermParser = XtermParser.getInstance();
        let command = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            let cleanedLine = await xtermParser.parseTerminalBuffer(line);
            cleanedLine = Util.removeLeadingLineWithWhitespace(cleanedLine); // Fix CTRL-U
            command += cleanedLine;
            if (i < lines.length-1) {command += `\n`;}
        }
        return command;
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
        // 1ワード目が一致していればそれを選択
        if (startCommandText.split(/\s+/)[0] === eCommandText.split(/\s+/)[0]) {
            return startCommandText;
        }
        // startCommandText にパイプが含まれる場合はそれを選択
        if (startCommandText.includes("|")) {
            return startCommandText;
        }
        return eCommandText;
    }
    
    static trimLastACommandSequence(input: string): string {
        const aCommand = "\u001b]633;A\u0007";
        const aIndex = input.lastIndexOf(aCommand);
        return aIndex !== -1 ? input.slice(0, aIndex).trimEnd() : input.trimEnd();
    }

    static removeOSC633Sequences(buffer: string): string {
        const osc633Regex = /\u001b\]633;[A-Za-z];?.*?\u0007/g;
        return buffer.replace(osc633Regex, "");
    }

    static removeLeadingAndTrailingEscapeCodes(input: string): string {
        // ANSIエスケープシーケンスにマッチする正規表現
        const ansiEscapeCodeRegex = /^\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/;
        const ansiEscapeCodeRegexEnd = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])$/;
    
        input = input.replace(ansiEscapeCodeRegex, '');
        input = input.replace(ansiEscapeCodeRegexEnd, '');
        return input;
    }

    static async parse(buffer: string): Promise<ParsedCommand> {
        // Split buffer into command and output parts using C-command delimiter
        const parsedCommand = new ParsedCommand();
        const parts = this.splitBufferByCommandSequence(buffer);
        const commandText = await this.extractCommandText(parts.commandBuffer + parts.outputBuffer.slice(0, 1024));
        console.log("extracted command text :", commandText);

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
                        console.log("E command text :", eCommandText);
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
        let output = this.trimLastACommandSequence(parts.outputBuffer);
        output = this.removeOSC633Sequences(output);
        parsedCommand.output = this.removeLeadingAndTrailingEscapeCodes(output);
        return parsedCommand;
    }
}
