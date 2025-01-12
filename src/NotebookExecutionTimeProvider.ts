import * as vscode from "vscode";
import { Command } from "./model/Command";

export class CellExecutionTimeProvider
    implements vscode.NotebookCellStatusBarItemProvider
{
    private readonly executionTimes = new Map<string, string>(); // Store execution times
    private isUpdating = false; // Flag to prevent recursion

    constructor(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.notebooks.registerNotebookCellStatusBarItemProvider(
                "terminal-notebook",
                this,
            ),
        );
        // Listen for notebook updates and trigger the update for the last cell
        vscode.workspace.onDidChangeNotebookDocument(async (event) => {
            // const notebook = event.document;
            if (!this.isUpdating) {
                const notebook = event.notebook;
                await this.updateLastCellExecutionTime(notebook);
            }
        });
    }

    // Provide status bar items for cells
    provideCellStatusBarItems(
        cell: vscode.NotebookCell,
    ): vscode.NotebookCellStatusBarItem | undefined {
        const execTime =
            this.executionTimes.get(cell.document.uri.toString()) ||
            "Not executed yet";
        return new vscode.NotebookCellStatusBarItem(
            `Execution Time: ${execTime}`,
            vscode.NotebookCellStatusBarAlignment.Right,
        );
    }

    // Update execution time for the last cell
    async updateLastCellExecutionTime(
        notebook: vscode.NotebookDocument,
    ): Promise<void> {
        if (notebook.cellCount === 0) {
            return;
        }

        const lastCell = notebook.cellAt(notebook.cellCount - 1);
        const rowid = lastCell.metadata.id;
        if (!rowid || lastCell.kind !== vscode.NotebookCellKind.Code) {
            return;
        }

        const row = await Command.getById(rowid);
        const startTime = new Date(row.start);
        const endTime = new Date(row.end);
        const execDuration = (endTime.getTime() - startTime.getTime()) / 1000;
        const hhmiSS = startTime.toTimeString().split(' ')[0];

        this.executionTimes.set(
            lastCell.document.uri.toString(),
            // `${execDuration.toFixed(2)}s`,
            hhmiSS,
        );
    }
}
