import * as vscode from 'vscode';
import { exec } from 'child_process';

export class Util {
    private static editorCommands = ['vi', 'vim', 'nano', 'emacs'];

    static formatDateWithMilliseconds(date: Date): string {
        const padZero = (num: number) => num.toString().padStart(2, '0');
        const milliseconds = date.getMilliseconds().toString().padStart(3, '0'); // Milliseconds formatted to 3 digits
    
        return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ` +
               `${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}.${milliseconds}`;
    }

    /**
     * Extracts the command text following the last prompt in a multi-line input.
     * If a prompt pattern is found, it returns the text after the last occurrence.
     * If no prompt pattern is detected, it returns the entire trimmed input.
     *
     * @param input - The multi-line input text from which to extract the command.
     * @returns The command text after the last detected prompt.
     */
    static extractCommandAfterLastPrompt(input: string): string {
        const promptPattern = /[^\s]+[$#]\s+/g;
        let lastPromptIndex = -1;
        let match: RegExpExecArray | null;
        while ((match = promptPattern.exec(input)) !== null) {
            lastPromptIndex = match.index + match[0].length;
        }
        return lastPromptIndex !== -1 ? input.substring(lastPromptIndex).trim() : input.trim();
    }
    
    /**
     * Removes backslash-newline sequences (`\ \n >`) from a multi-line command,
     * allowing command continuation lines to be combined into a single line.
     *
     * @param command - The multi-line command string containing backslash-newline sequences.
     * @returns The single-line command string after removing backslash-newline sequences.
     */
    static removeBackslashNewline(command: string): string {
        return command.replace(/\\\n>\s/g, '');
    }

    /**
     * Formats the buffer output from xterm.js when `ctrl+u` (command cancellation) is used in the console.
     * In xterm.js, `ctrl+u` is interpreted directly by the shell (e.g., bash, zsh), which clears the entire line.
     * After this operation, the terminal buffer often contains an unintended long whitespace segment before the new command entry.
     * 
     * This method addresses these cases by removing the first line if the second line contains 20 or more whitespace characters
     * before the command text, which may result from `ctrl+u` interactions in the terminal buffer.
     *
     * @param command - The command buffer output potentially containing lines with leading whitespace after `ctrl+u` use.
     * @returns - The formatted command string, with unnecessary leading whitespace lines removed.
     */
    static removeLeadingLineWithWhitespace(command: string): string {
        // 正規表現で20文字以上の空白を含む2行目を検出し、2行目のコマンドのみを抽出
        return command.replace(/^.*\n\s{20,}(.+)$/s, '$1');
    }

    /**
     * Extracts the command text for execution from a raw command input.
     * It first identifies the last command after a prompt, removes continuation sequences,
     * and removes any lines with excessive indentation.
     *
     * @param commandText - The full raw command input from which to extract the executable command.
     * @returns The cleaned command text ready for execution.
     */
    static extractCommandByStartEvent(commandText: string): string {
        const command1 = Util.extractCommandAfterLastPrompt(commandText);
        const command2 = Util.removeBackslashNewline(command1);
        return Util.removeLeadingLineWithWhitespace(command2);
    }
   
    static removeTrailingSemicolon(input: string): string {
        return input.endsWith(';') ? input.slice(0, -1) : input;
    }

    static cleanDeleteSequenceString(input: string): string {
        const stack: string[] = [];
        // delete an escape sequence for erase
        const unescapeInput = input.replace(/\u001B\[K/g, '');

        // Iterate over each character in the input string
        for (let i = 0; i < unescapeInput.length; i++) {
            const char = unescapeInput[i];
            if (char === '\b') {
                // If it's a backspace, remove the last character from the stack
                stack.pop();
            } else {
                stack.push(char);
            }
        }
        return stack.join('');
    }

    static getActiveNotebookFileName() {
        const activeNotebook = vscode.window.activeNotebookEditor?.notebook;
        if (activeNotebook) {
            const fileName = activeNotebook.uri.path.split('/').pop();
            console.log(`Active Notebook File Name: ${fileName}`);
            return fileName;
        } else {
            console.log("No active notebook");
            return null;
        }
    }
    
    static openExcelFile(filePath: string) {
        exec(`start excel "${filePath}"`, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage(`Error opening Excel: ${stderr}`);
                return;
            }
            vscode.window.showInformationMessage('Excel file opened successfully!');
        });
    }

    // /**
    //  * Searches the input command buffer for an editor command and returns the file name.
    //  * @param commandBuffer The string representing the command input (e.g., 'vi filename.txt')
    //  * @returns The file name if an editor command is found, otherwise undefined.
    //  */
    // static checkFileNameFromEditorCommand(commandBuffer: string): string | undefined {
    //     const commandParts = commandBuffer.trim().split(/\s+/);
    //     if (commandParts.length > 1 && this.editorCommands.includes(commandParts[0])) {
    //         return commandParts[1];
    //     }
    //     return undefined;
    // }

    /**
     * Remove undesirable characters (like quotes, etc.)
     * Split by spaces, capitalize the first letter of each word (except the first), and join them
     * @param text 
     * @returns camel case text
     */
    static toCamelCase(text: string): string {
        const sanitizedText = text.replace(/["'<>:*?|\\/]+/g, '');
        return sanitizedText
            .split(/\s+/)
            .map((word, index) =>
                index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('');
    }    
}