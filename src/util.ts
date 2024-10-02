import * as vscode from 'vscode';
import { exec } from 'child_process';

export class Util {
    private static editorCommands = ['vi', 'nano', 'emacs'];

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

    /**
     * Searches the input command buffer for an editor command and returns the file name.
     * @param commandBuffer The string representing the command input (e.g., 'vi filename.txt')
     * @returns The file name if an editor command is found, otherwise undefined.
     */
    static checkFileNameFromEditorCommand(commandBuffer: string): string | undefined {
        const commandParts = commandBuffer.trim().split(/\s+/);
        if (commandParts.length > 1 && this.editorCommands.includes(commandParts[0])) {
            return commandParts[1];
        }
        return undefined;
    }

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