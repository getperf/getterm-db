import { Logger } from './logger';
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

/**
 * Represents the structure of a parsed command, including its command string,
 * output, exit code, and the current working directory (cwd).
 */
export class ParsedCommand {
    command = '';
    output = '';
    exitCode: number | null = null;
    cwd = '';
}

/**
 * CommandParser provides methods to parse commands and outputs from terminal buffers,
 * specifically handling escape sequences such as OSC 633 for structured parsing.
 */
export class CommandParser {

    // /**
    //  * Cleans the command output by removing any trailing prompt lines.
    //  * If a "$" prompt exists at the end, the method trims text up to the last newline.
    //  * @param output - The command output to clean.
    //  * @returns Cleaned output without trailing prompts.
    //  */
    // static cleanCommandOutput(output: string): string {
    //     // Check if the string ends with "$" and has a preceding newline
    //     if (output.trim().endsWith("$") || output.trim().endsWith("#")) {
    //         const lastNewlineIndex = output.lastIndexOf("\n");
    //         if (lastNewlineIndex !== -1) {
    //             // Return the string up to the last newline (excluding the prompt line)
    //             return output.slice(0, lastNewlineIndex).trim();
    //         }
    //     }
    //     return output.trim();  // Return the trimmed output if no $ prompt is present
    // }

    // static extractCommandResult(message: string): string | null {
    //     // const regex = /\]633;C([\s\S]+?)\]633;D;/;
    //     const regex = /\x1B\]633;C\x07([\s\S]*?)\x1B\]633;D;/;
    //     const match = message.match(regex);
    //     return match ? match[1].trim() : null;
    // }
    
    // /**
    //  * Parses OSC 633 sequences and the command from the input buffer.
    //  * This method detects structured terminal sequences and extracts relevant data.
    //  * @param input - The terminal buffer input string.
    //  * @returns A ParsedCommand object with command, output, exit code, and cwd data, or null if parsing fails.
    //  */
    // static async parseOSC633AndCommand(input: string) : Promise<ParsedCommand | null> {
    //     const oscRegex = /\x1B\]633;([A-ZP])([^\x07]*)?\x07/g;
    //     const command = new ParsedCommand();

    //     // Extract command from the start of the buffer until the first OSC-633 sequence starts
    //     const commandResult = this.extractAfterOSC633CommandSequence(input);
    //     if (!commandResult) {
    //         Logger.error(`
    //             Detected multiple OSC-633 start escape sequences in buffer. 
    //             Exits with an error because it is difficult to parse :
    //             ${input}
    //         `);
    //         return null;
    //     }
    //     let buffer = commandResult.remainingText;
    //     console.log("FILTER OUT:", buffer);

    //     const xtermParser = XtermParser.getInstance();
    //     command.command =  await xtermParser.parseTerminalBuffer(commandResult.commandText);

    //     // Extract exclude the all OSC sequence as the output
    //     let output =  await xtermParser.parseTerminalBuffer(buffer);
    //     output = this.cleanCommandOutput(output);
    //     // command.output = Util.removePromptLine(output);
    //     command.output = this.extractCommandResult(buffer) || output;
    //     // const output2 = this.extractCommandResult(buffer);
    //     // if (output2) {
    //     //     command.output = output2;
    //     // }

    //     let lastIndex = 0;
    //     let match;
    //     while ((match = oscRegex.exec(buffer)) !== null) {
    //         const oscType = match[1];  // A, B, C, D, E, P
    //         const oscData = match[2] || '';  // The oscData after the ; in the sequence
    //         lastIndex = oscRegex.lastIndex;
    //         switch (oscType) {
    //             case 'C':  // Command result starts
    //             case 'B':  // Command result starts
    //                 break;
    //             case 'D':  // Exit code
    //                 const exitCodeString = oscData.split(';')[1];  // Extract exit code from the format `;0`
    //                 if (exitCodeString){
    //                     command.exitCode = parseInt(exitCodeString, 10);  // Capture the exit code
    //                 }
    //                 break;
    //             case 'P':  // Current working directory
    //                 command.cwd = oscData.split('=')[1] || '';  // Extract cwd from the format `Cwd=...`
    //                 break;
    //             default:
    //                 break;
    //         }
    //     }
    //     return command;
    // }

    // /**
    //  * Extracts the output of a command within a terminal buffer.
    //  * @param terminalBuffer - Full terminal buffer as a string.
    //  * @param command - The command to locate within the buffer.
    //  * @returns A Promise containing the command's output, excluding any trailing prompts.
    //  * @throws An error if the command is not found in the buffer.
    //  */
    // static async extractCommandOutput(terminalBuffer: string, command: string): Promise<string> {
    //     const commandPosition = terminalBuffer.lastIndexOf(command);  // Find the last occurrence of the command
    //     const xtermParser = XtermParser.getInstance();
    //     if (commandPosition === -1) {
    //         throw new Error(`Command not found in terminal buffer: ${command}`);
    //     }
    
    //     // Remove everything before the command
    //     const bufferOutputPart = terminalBuffer.substring(commandPosition + command.length + 1);
    //     const output = await xtermParser.parseTerminalBuffer(bufferOutputPart);
    //     return this.cleanCommandOutput(output);
    // }

    // static extractCommand(buffer: string): string {
    //     // バッファの後ろからEコマンドを検索して、その前を切り捨てる
    //     const eCommandIndex = buffer.lastIndexOf("\u001b]633;E;");
    //     if (eCommandIndex !== -1) {
    //         buffer = buffer.substring(eCommandIndex + "\u001b]633;E;".length);
    //     }
      
    //     // Bコマンド以降を削除
    //     const bCommandIndex = buffer.lastIndexOf("\u001b]633;B");
    //     if (bCommandIndex !== -1) {
    //         buffer = buffer.substring(0, bCommandIndex);
    //         // buffer = buffer.substring(bCommandIndex + "\u001b]633;B".length);
    //     }
    //     return buffer.trim();
    // }
      
    // /**
    //  * Extracts text following the OSC-633 sequence for command detection.
    //  * Uses regex to capture sequences beginning with `\x1b]633;E;` and ending in `;\x07`.
    //  * @param input - Terminal buffer input as a string.
    //  * @returns An object containing the command text and remaining text after the sequence, or null if no match.
    //  */
    // static extractAfterOSC633CommandSequence(input: string): { commandText: string, remainingText: string } | null {
    //     // Search for the last occurrence of the OSC-633 "E" command pattern using a reverse (trailing) match.
    //     const regex = /\x1b\]633;E;(.*?);\x07/;
    //     const match = input.match(regex);

    //     if (match && match.index !== undefined) {
    //         console.log("マッチしたインデックス：", match.index);
    //         const newCommand = CommandParser.extractCommand(input);
    //         console.log("新コマンド解析結果:", newCommand);
    //         let commandText = match[1];
    //         commandText = Util.unescapeString(commandText);
    //         const afterKeyword = input.slice(match.index);

    //         return {
    //             commandText,
    //             remainingText: afterKeyword
    //         };
    //     }

    //     return null;
    // }        
}
