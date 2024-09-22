import * as vscode from 'vscode';
import { Logger } from './logger';
import { Util } from './util';

 /** 
シェル統合シーケンスのファイナライズ
 * https://github.com/microsoft/vscode/issues/155639

 * VS Code 固有のシェル統合シーケンス。これらのいくつかは、次のような一般的な代替手段に基づいています 
 * FinalTermで先駆的なもの。完全にカスタムシーケンスに移行するという決定は、次のことを試みることでした。 
 *信頼性を向上させ、アプリケーションが端末を混乱させる可能性を防ぎます。 

 * プロンプトの開始は、常に行の先頭に表示されることが期待されます。 
　 FinalTermの「OSC 133;A ST'. 
    PromptStart = 'A'、 
 
* コマンドの開始、すなわち。ここで、ユーザーがコマンドを入力します。 
　 FinalTermの「OSC 133;B ST '。 
    CommandStart = 'B'、 
 
* コマンド出力が始まる直前に送信されます。 
　 FinalTermの「OSC 133;C ST '。 
    コマンド実行 = 'C'、 
 
* コマンドが終了した直後に送信されます。終了コードは、指定されていない場合、オプションです 
 は、コマンドが実行されなかったことを意味します (つまり、空のプロンプトで入力するか、Ctrl+C)。 
 FinalTermの「OSC 133;D [; <ExitCode>] ST'. 
    CommandFinished = 'D'、 
 
* コマンドラインを明示的に設定します。これは、conptyが 
 パススルーモードは、実行されたコマンドを送信するためのWindows上のオプションを提供します。で 
このシーケンスは、信頼性の低いカーソル位置に基づいて推測する必要はありません。 
それ以外の場合は * が必要になります。 
    コマンドライン = 'E', 
 
*プロンプトスタートに似ていますが、行の継続用です。 
    継続開始 = 'F', 
 
* コマンドの開始と似ていますが、行の継続が用です。 
    ContinuationEnd = 'G', 
 
* 右プロンプトの開始。 
    RightPromptStart = 'H', 
 
* 右プロンプトの終了。 
    RightPromptEnd = 'I', 
 
* 任意のプロパティを設定します: 'OSC 633 ;P ;<Property>=<Value> ST'の場合、既知のプロパティのみが実行されます。 
    Property = 'P' 
*/

export class ParsedCommand {
    command = '';
    output = '';
    exitCode: number | null = null;
    cwd = '';
}

export class OSC633Parser {
    private static extractOutputOfOSC633B(output: string): string {
        // Split the output by the OSC 633;B sequence
        const parts = output.split('\u0007\u001B]633;B\u0007');
        if (parts.length < 2) {return ''; }
        
        // The relevant part is after the OSC 633;B sequence
        let result = parts[1].trim();
        
        // Remove the prompt if it exists
        const promptPattern = /\[\w+@\w+.*?\$\s*$/;
        result = result.replace(promptPattern, '').trim();
        
        // Return the cleaned-up result
        return result.length > 0 ? result : '';
    }

    static removeAnsiEscapeCodes(output: string): string {
        // Regex to match ANSI escape codes
        const ansiRegex = /\x1b\[[0-9;?]*[a-zA-Z]/g;
    
        // Remove ANSI escape codes
        const cleanOutput = output.replace(ansiRegex, '');
    
        // Extract the actual command or result (in this case 'pwd')
        const command = cleanOutput.trim();
    
        return command;
    }

    static filterOSCSequenceHeader(buffer: string): string {
        // Define the sequences
        const oscAAndBSequence = '\x1b]633;A\x07\x1b]633;B\x07';
        const osc0Start = '\x1b]0;';
        const oscEnd = '\x07';
        console.log("FILTER IN:", buffer);
        // Find the start and end of the sequences
        const oscAAndBIndex = buffer.indexOf(oscAAndBSequence);
        if (oscAAndBIndex !== 0) {
            // If the buffer does not start with OSC A, return it unchanged
            return buffer;
        }
        buffer = buffer.slice(oscAAndBSequence.length);
        // const osc0StartIndex = buffer.indexOf(osc0Start, oscAAndBIndex);
        const osc0StartIndex = buffer.indexOf(osc0Start);
        if (osc0StartIndex === -1) {
            // If there's no OSC 0 sequence, return the buffer unchanged
            return buffer;
        }
        buffer = buffer.slice(osc0StartIndex + osc0Start.length);
    
        const osc0EndIndex = buffer.indexOf(oscEnd);
        if (osc0EndIndex === -1) {
            // If there's no terminating BEL, return the buffer unchanged
            return buffer;
        }
        buffer = buffer.slice(osc0EndIndex + oscEnd.length);
    
        // Return the part of the buffer after the OSC 0 sequence
        // return buffer.slice(osc0EndIndex + oscEnd.length);
        return buffer;
    }

    static cleanCommandLines(buffer: string): string {
        // Split the input into lines
        const lines = buffer.split('\n');
        console.log("INPUT:", lines);
        // Process the first line: remove from start to "$ " if it exists
        if (lines[0].includes('$ ')) {
            lines[0] = lines[0].substring(lines[0].indexOf('$ ') + 2);
        }
    
        // Process remaining lines: remove "> " if it exists
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].startsWith('> ')) {
                lines[i] = lines[i].substring(2);
            }
        }
    
        // Join lines and remove the specified escape codes
        const cleanedOutput = lines.join('\n')
            .replace(/\x1b\]633;F\x07/g, '') // Remove OSC 633;F
            .replace(/\x1b\]633;G\x07/g, ''); // Remove OSC 633;G
    
        console.log("OUTPUT:", cleanedOutput);
        return cleanedOutput;
    }
    
    static cleanCommandOutput(output: string): string {
        // Replace the escape code with an empty string if it exists
        const ansiEscapeRegex = /\x1B\[\d*C$/;
        output = output.replace(ansiEscapeRegex, '').
            replace(/\u001b\[\d+X/g, '');

        // Check if the string ends with "$" and has a preceding newline
        if (output.endsWith("$")) {
            const lastNewlineIndex = output.lastIndexOf("\n");
            if (lastNewlineIndex !== -1) {
                // Return the string up to the last newline (excluding the prompt line)
                return output.slice(0, lastNewlineIndex).trim();
            }
        }
        return output.trim();  // Return the trimmed output if no $ prompt is present
    }
    
    // OSC 633 を解析する関数。onDidWriteTerminalData でバッファリングしたデータを解析する
    static parseOSC633AndCommand(input: string) : ParsedCommand {
        const oscRegex = /\x1B\]633;([A-ZP])([^\x07]*)?\x07/g;
        const command = new ParsedCommand();

        let buffer = this.filterOSCSequenceHeader(input);
        console.log("FILTER OUT:", buffer);
        // Extract command from the start of the buffer until the first OSC-633 sequence starts
        const firstOSCMatch = buffer.match(/\x1B\]633;[A-ZP];/);
        if (firstOSCMatch) {
            // Clean Multiple lines
            const commandText = buffer.slice(0, firstOSCMatch.index).trim();
            command.command = this.cleanCommandLines(commandText);
            buffer = buffer.slice(firstOSCMatch.index);
        }
        // Extract exclude the all OSC sequence as the output
        let output =  buffer.replace(oscRegex, '').trim();
        console.log("RESULT:", output);
        command.output = this.cleanCommandOutput(output);

        let lastIndex = 0;
        let match;
        while ((match = oscRegex.exec(buffer)) !== null) {
            const oscType = match[1];  // A, B, C, D, E, P
            const oscData = match[2] || '';  // The oscData after the ; in the sequence
            // console.log("CHECK: ", oscType, oscData, oscRegex.lastIndex);
            lastIndex = oscRegex.lastIndex;
            switch (oscType) {
                case 'C':  // Command result starts
                case 'B':  // Command result starts
                    break;
                case 'D':  // Exit code
                    const exitCodeString = oscData.split(';')[1];  // Extract exit code from the format `;0`
                    if (exitCodeString){
                        command.exitCode = parseInt(exitCodeString, 10);  // Capture the exit code
                    }
                    break;
                case 'P':  // Current working directory
                    command.cwd = oscData.split('=')[1] || '';  // Extract cwd from the format `Cwd=...`
                    break;
                default:
                    break;
            }
        }
        return command;
    }

    // OSC 633 を解析する関数。onDidWriteTerminalData でバッファリングしたデータを解析する
    static parseOSC633Simple(input: string) : ParsedCommand {
        input = OSC633Parser.removeAnsiEscapeCodes(input);
        const parsedCommand = new ParsedCommand();
        // Split the input by OSC 633 sequences
        const parts = input.split(/\u001b\]633;/);

        if (parts.length > 0) { 
            parsedCommand.command = Util.cleanDeleteSequenceString(parts[0].trim());
        };
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (part.startsWith('D;')) {
                // Extract the exit code from the sequence starting with 'D;'
                parsedCommand.exitCode = parseInt(part.slice(2).trim(), 10);
            } else if (part.startsWith('C')) {
                // Extract the output which is between 'C' and next sequence.
                parsedCommand.output = parts[i].replace(/^C\u0007\n/, '').trim();
            } else if (part.startsWith('P;Cwd=')) {
                // Extract the working directory from the sequence starting with 'P;Cwd='
                // parsedCommand.cwd = part.slice(6).trim();
                let cwd = part.slice(6);
                cwd = cwd.replace(/\x07/g, ''); 
                parsedCommand.cwd = cwd.trim();
            }
        }
        console.log("COMMAND OUTPUT:" , parsedCommand.output);
        if (parsedCommand.output === 'C\u0007') { 
            console.log("PARSE OSC633B");
            parsedCommand.output = this.extractOutputOfOSC633B(input);
        }
        return parsedCommand;
    }

}
