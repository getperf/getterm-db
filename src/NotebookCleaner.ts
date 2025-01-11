import * as vscode from "vscode";
import { Logger } from "./Logger";
// import { TerminalNotebookController } from './notebook_controller';

export class NotebookCleaner {
    // private controller : TerminalNotebookController;

    // constructor(controller: TerminalNotebookController) {
    //     this.controller = controller;
    // }

    static cleanupUnusedCells() {
        const notebookEditor = vscode.window.activeNotebookEditor;
        if (!notebookEditor) {
            return;
        }
        const notebookDocument = notebookEditor.notebook;
        const currentRow = notebookDocument.cellCount;
        if (currentRow > 0) {
            const activeCell = notebookDocument.cellAt(currentRow);
            const cellContent = activeCell.document.getText();
            if (!cellContent) {
                const edit = new vscode.WorkspaceEdit();
                Logger.warn(`delete empty cell : ${currentRow}`);
                const range = new vscode.NotebookRange(
                    currentRow - 1,
                    currentRow,
                );
                const nedit = vscode.NotebookEdit.deleteCells(range);
                edit.set(notebookDocument.uri, [nedit]);
                vscode.workspace.applyEdit(edit);
            }
        }
    }
}
