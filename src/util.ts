import * as vscode from 'vscode';
import { exec } from 'child_process';

export class Util {
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
}