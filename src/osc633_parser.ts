import * as vscode from 'vscode';
import { Logger } from './logger';
import { Terminal } from 'xterm-headless';
import { Util } from './util';
import { XtermParser } from './xterm_parser';

 /** 
  シェル統合シーケンスのファイナライズ
  https://github.com/microsoft/vscode/issues/155639

  VS Code 固有のシェル統合シーケンス。これらのいくつかは、次のような一般的な代替手段に基づいています 
  FinalTermで先駆的なもの。完全にカスタムシーケンスに移行するという決定は、次のことを試みることでした。 
  信頼性を向上させ、アプリケーションが端末を混乱させる可能性を防ぎます。 

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

    static filterOSCSequenceHeader(buffer: string): string | null {
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
    
    static cleanCommandOutput(output: string): string {
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

    // OSC 633 開始シーケンスが複数含まれるかを判別
    static hasMultipleOSCStartSequences(buffer: string): boolean {
        // Regular expression to match OSC-633;A sequence
        const regex = /\u001b\]633;A\u0007/g;
        
        // Find all matches of the escape sequence in the buffer
        const matches = buffer.match(regex);
        
        // Check if two or more matches are found
        return matches !== null && matches.length >= 2;
    }
    
    // OSC 633 を解析する関数。onDidWriteTerminalData でバッファリングしたデータを解析する
    static async parseOSC633AndCommand(input: string) : Promise<ParsedCommand | null> {
        const oscRegex = /\x1B\]633;([A-ZP])([^\x07]*)?\x07/g;
        const command = new ParsedCommand();

        if (this.hasMultipleOSCStartSequences(input)) {
            Logger.error(`
                Detected multiple OSC-633 start escape sequences in buffer. 
                Exits with an error because it is difficult to parse :
                ${input}
            `);
            return null;
        }
        let buffer = this.filterOSCSequenceHeader(input);
        if (!buffer) {
            Logger.error(`Failed to parse header of OSC-633 sequence : ${input}`);
            return null;
        }
        console.log("FILTER OUT:", buffer);

        // Extract command from the start of the buffer until the first OSC-633 sequence starts
        const xtermParser = XtermParser.getInstance();
        const firstOSCMatch = buffer.match(/\x1B\]633;[A-ZP];/);
        if (firstOSCMatch)  {
            // Clean Multiple lines
            let commandText = buffer.slice(0, firstOSCMatch.index).trim();
            // Handle backward search for Ctrl+U (0x15) and remove preceding content
            const ctrlUIndex = commandText.lastIndexOf('\x1B[K');
            console.log("CTRL-U : ", ctrlUIndex);
            if (ctrlUIndex !== -1) {
                commandText = commandText.slice(ctrlUIndex + 3);  // Cut everything before Ctrl+U
            }

            // command.command = this.cleaningMultiLineCommands(commandText);
            command.command =  await xtermParser.parseTerminalBuffer(commandText);
            buffer = buffer.slice(firstOSCMatch.index);
        } else {
            Logger.error(`Failed to extract command from OSC-633 sequence : ${buffer}`);
            return null;
        }

        // Extract exclude the all OSC sequence as the output
        let output =  await xtermParser.parseTerminalBuffer(buffer);
        command.output = this.cleanCommandOutput(output);

        let lastIndex = 0;
        let match;
        while ((match = oscRegex.exec(buffer)) !== null) {
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
}
