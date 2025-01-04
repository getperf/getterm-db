import { Logger } from './Logger';
import { Util } from './Util';
import { XtermParser } from './XtermParser';

export class ParsedCommand {
    command = '';
    output = '';
    exitCode: number | null = null;
    cwd = '';
}

export class CommandParser {

    static parseMultilineCommand(buffer: string): string {
        const lines = buffer.split(/\r?\n/);
        Logger.info(`command line paser input :${JSON.stringify(lines)}`);
        let command = lines[0].trim(); // 初期コマンドを1行目として開始

        // 正規表現でOSC633のF,Gコマンドと余分な「>」を検出
        const regex = /\x1B\]633;F\x07>\s*\x1B\]633;G\x07/g;
        command = command.replace(regex, "\\\n");
        // command = command.replace(regex, "\\");
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
        Logger.info(`command line paser output :${JSON.stringify(command)}`);
        return command.trim();
    }

    static async extractCommandText(buffer: string): Promise<string> {
        Logger.debug(`extract command text input : ${JSON.stringify(buffer)}`);
        const lines = this.parseMultilineCommand(buffer).split(/\n/);
        const xtermParser = XtermParser.getInstance();
        let command = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            let cleanedLine = await xtermParser.parseTerminalBuffer(line, true);
            cleanedLine = Util.removeLeadingLineWithWhitespace(cleanedLine); // Fix CTRL-U
            command += cleanedLine;
            // if (i < lines.length-1) {command += `\n`;}
        }
        command = command.replace(/\\x3b/g, ";");
        command = command.replace(/\n$/, '');
        Logger.debug(`extract command text output : ${JSON.stringify(command)}`);
        return command;
    }

    static splitBufferByCommandSequence(buffer: string): { commandBuffer: string; outputBuffer: string } {
        const osc633CommandB = "\u001b]633;B\u0007";
        const osc633CommandC = "\u001b]633;C\u0007";
    
        Logger.debug(`split the console buffer input : ${JSON.stringify(buffer)}`);
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
        Logger.debug(`split the console buffer into the command : ${JSON.stringify(commandBuffer)}  and output : ${JSON.stringify(outputBuffer)}`);
        return {
            commandBuffer,
            outputBuffer,
        };
    }

    static selectCompleteCommand(startCommandText: string | undefined, eCommandText: string): string {
        Logger.info(`choose complete command : ${startCommandText} and ${eCommandText}`);
        if (!startCommandText) {return eCommandText;}
        if (!eCommandText) {return startCommandText;}
        if (startCommandText.split(/\s+/)[0] === eCommandText.split(/\s+/)[0]) {
            Logger.info(`first word matches pattern`);
            return startCommandText;
        }
        if (startCommandText.includes("|")) {
            Logger.info(`pattern that contains a pipe ('|').`);
            return startCommandText;
        }
        Logger.info(`no patterns matched, so the E command is selected.`);
        return eCommandText;
    }
    
    static trimLastACommandSequence(input: string): string {
        const aCommand = "\u001b]633;A\u0007";
        const aIndex = input.lastIndexOf(aCommand);
        return aIndex !== -1 ? input.slice(0, aIndex).trimEnd() : input.trimEnd();
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
        Logger.info(`start command parser`);
        const parsedCommand = new ParsedCommand();
        const parts = this.splitBufferByCommandSequence(buffer);
        const commandText = await this.extractCommandText(parts.commandBuffer + parts.outputBuffer.slice(0, 1024));
        Logger.info(`extracted command text : ${JSON.stringify(commandText)}`);

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
        Logger.debug(`extracted output with the command sequences removed : ${JSON.stringify(output)}`);
        const xtermParser = XtermParser.getInstance();
        output = await xtermParser.parseTerminalBuffer(output, true);
        Logger.debug(`extracted output with the xterm.js parser : ${JSON.stringify(output)}`);
        parsedCommand.output  = output;
        Logger.info(`end command parser`);
        return parsedCommand;
    }
}
