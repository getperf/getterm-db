import * as vscode from "vscode";
import ExcelJS from "exceljs";
import { Note } from "./model/Note";
import { Cell } from "./model/Cell";
import * as fs from "fs";
import path from "path";
import {
    RawNotebookCell,
    RawNotebookData,
    TerminalNotebookSerializer,
} from "./NotebookSerializer";
import { Util } from "./Util";
import { MarkdownExport } from "./MarkdownExport";

// 列定義の型
type ColumnDefinition = {
    header: string;
    key: string;
    width: number;
    alignment: Partial<ExcelJS.Alignment>;
};

// 列定義
const columns: ColumnDefinition[] = [
    {
        header: "No",
        key: "position",
        width: 5,
        alignment: { vertical: "top", horizontal: "left" },
    },
    // { header: 'Type', key: 'type', width: 10, alignment: { vertical: 'top', horizontal: 'left' } },
    {
        header: "Session",
        key: "session",
        width: 10,
        alignment: { vertical: "top", horizontal: "left", wrapText: true },
    },
    {
        header: "Content",
        key: "content",
        width: 40,
        alignment: { vertical: "top", horizontal: "left", wrapText: true },
    },
    {
        header: "Output",
        key: "output",
        width: 40,
        alignment: { vertical: "top", horizontal: "left", wrapText: true },
    },
    {
        header: "Start Time",
        key: "start",
        width: 12,
        alignment: { vertical: "top", horizontal: "right" },
    },
    {
        header: "End Time",
        key: "end",
        width: 12,
        alignment: { vertical: "top", horizontal: "right" },
    },
    {
        header: "Duration",
        key: "duration",
        width: 10,
        alignment: { vertical: "top", horizontal: "right" },
    },
    {
        header: "Exit",
        key: "exit_code",
        width: 5,
        alignment: { vertical: "top", horizontal: "center" },
    },
];

export class TerminalNotebookExporter {
    private context: vscode.ExtensionContext;
    private isSaving = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
        this.registerEventHandlers();
    }

    private registerCommands() {
        this.context.subscriptions.push(
            // vscode.commands.registerCommand('workbench.action.files.save', async () => {
            //   if (!this.isSaving) {
            //     this.isSaving = true;

            //     console.log('Manual save detected!');
            //     const activeEditor = vscode.window.activeTextEditor;
            //     const activeNotebookEditor = vscode.window.activeNotebookEditor;
            //     try {
            //       if (activeNotebookEditor) {
            //         await this.saveNotebookToDatabase();
            //       } else if (activeEditor) {
            //         // Handle normal file save
            //         console.log('Saving regular file...');
            //         await vscode.commands.executeCommand('workbench.action.files.save');
            //       } else {
            //         console.log('No active editor found.');
            //       }
            //     } catch (error) {
            //       console.error('Error during save operation:', error);
            //     } finally {
            //       setTimeout(() => {
            //         this.isSaving = false;
            //       }, 500);
            //     }
            //   }
            // }),
            vscode.commands.registerCommand(
                "getterm-db.reportTerminalNotebook",
                async () => {
                    await this.saveNotebookToDatabase();
                    this.reportTerminalNotebook();
                },
            ),
            vscode.commands.registerCommand(
                "getterm-db.exportMarkdown",
                async () => {
                    await MarkdownExport.exportNotebook();
                },
            ),
        );
    }

    private registerEventHandlers() {
        // vscode.workspace.onDidSaveNotebookDocument((notebook) => {
        //   this.saveNotebookDB(notebook);
        // });
        // vscode.workspace.onDidOpenNotebookDocument((notebook) => {
        //   this.saveNotebookDB(notebook);
        // });
    }

    async saveNotebookToDatabase() {
        const document = vscode.window.activeNotebookEditor?.notebook;
        if (document) {
            const notebookUri = document.uri;
            // const notebookTitle = notebookUri.path.split('/').pop() || 'Untitled';
            const notebookTitle = notebookUri.path;
            const notebookData =
                TerminalNotebookSerializer.getNotebookData(document);
            await TerminalNotebookExporter.saveNotebook(
                notebookData,
                notebookTitle,
            );
            console.log(`saveNotebookDB : ${notebookTitle}`);
        }
    }

    /**
     * Formats a cell in the worksheet.
     */
    formatCell(cell: ExcelJS.Cell, colNumber: number, rowIndex: number) {
        // Add border to each cell
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        };

        // Set alignment to top and wrap text
        cell.alignment = {
            vertical: "top",
            wrapText: true,
        };

        // Apply alignment from the column definitions
        const columnDef = columns[colNumber - 1]; // 1-based index
        if (columnDef?.alignment) {
            cell.alignment = columnDef.alignment;
        }

        // Apply special styles for the header row
        if (rowIndex === 1) {
            cell.font = { bold: true }; // Bold header
            // Left-aligned
            cell.alignment = { horizontal: "left", vertical: "middle" };
        }
    }

    /**
     * Calculates the row height based on the content length.
     */
    calculateRowHeight(values: string[]): number {
        const estimatedHeight = values.reduce((maxHeight, text) => {
            const textLength = text.length;
            const estimatedLineCount = Math.ceil(textLength / 20); // Estimate line count based on width
            return Math.max(maxHeight, estimatedLineCount);
        }, 1);

        return estimatedHeight * 15; // Multiply by a base height factor
    }

    /**
     * Adjusts the height of a row based on its content.
     */
    adjustRowHeight(row: ExcelJS.Row, rowIndex: number) {
        if (rowIndex === 1) {
            row.height = 25; // Header row
            return;
        }

        const validValues = ((row.values as (string | undefined)[]) || [])
            .filter((val, index) => index !== 0 && typeof val === "string")
            .map((val) => val || "");

        row.height = this.calculateRowHeight(validValues);
    }

    applyExitCodeFormatting(row: ExcelJS.Row, rowIndex: number) {
        if (rowIndex === 1) {
            return;
        }
        const exitCodeCell = row.getCell("exit_code"); // Use the column key
        if (exitCodeCell.value === null) {
            // Handle null
            exitCodeCell.value = "-";
            return;
        }
        const exitCode = Number(exitCodeCell.value);
        if (Number.isNaN(exitCode)) {
            return;
        }
        if (exitCode === 0) {
            exitCodeCell.value = "OK";
            exitCodeCell.font = { color: { argb: "99009900" } }; // Green color
        } else {
            exitCodeCell.value = `NG(${exitCode})`;
            exitCodeCell.font = { color: { argb: "99990000" } }; // Red color
        }
    }

    async reportTerminalNotebook() {
        const workspaceRoot =
            vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
        const document = vscode.window.activeNotebookEditor?.notebook;
        if (!document) {
            vscode.window.showErrorMessage("No active notebook editor found");
            return;
        }

        const notebookTitle = document.uri.path;
        const note = await Note.getByTitle(notebookTitle);
        if (!note) {
            vscode.window.showErrorMessage(
                "The open terminal notebook has not been saved",
            );
            return;
        }

        const notebookId = note.id;
        const rows = await Note.reportQuery(notebookId);

        // Create Excel Workbook and Worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Note Report");

        // Add Columns
        worksheet.columns = columns.map((col) => ({
            header: col.header,
            key: col.key,
            width: col.width,
        }));

        for (const row of rows) {
            const startTime = new Date(row.start);
            const endTime = new Date(row.end);
            const durationFormatted = Util.calculateDuration(
                startTime,
                endTime,
            );
            worksheet.addRow({
                position: row.position,
                session: row.profile_name ?? "-",
                // type: row.type,
                content: Util.escapeXml(row.content),
                output: Util.escapeXml(row.output),
                start: Util.formatTime(startTime),
                end: Util.formatTime(endTime),
                duration: durationFormatted,
                exit_code: row.exit_code ?? "-",
            });
        }

        // Format Rows and Cells
        worksheet.eachRow((row, rowIndex) => {
            row.eachCell((cell, colNumber) => {
                this.formatCell(cell, colNumber, rowIndex);
            });
            this.adjustRowHeight(row, rowIndex);
            this.applyExitCodeFormatting(row, rowIndex);
        });

        // Write to Excel File
        const filePath = path.join(
            workspaceRoot,
            `notebook_${notebookId}_report.xlsx`,
        );
        try {
            await workbook.xlsx.writeFile(filePath);
            vscode.window.showInformationMessage(
                `Excel report saved to ${filePath}`,
            );
            Util.openExcelFile(filePath);
        } catch (err) {
            vscode.window.showErrorMessage(`Error writing Excel file: ${err}`);
        }
    }

    static async saveNotebook(
        notebookData: RawNotebookData,
        notebookTitle: string,
    ): Promise<Note> {
        const sessionId = notebookData.metadata?.sessionId || null;
        let note = await Note.getByTitle(notebookTitle);
        if (note) {
            await Note.update(note.id, notebookTitle);
            await Cell.deleteByNotebookId(note.id);
        } else {
            note = await Note.create(notebookTitle);
        }
        for (let i = 0; i < notebookData.cells.length; i++) {
            const cell: RawNotebookCell = notebookData.cells[i];
            // const commandId = cell.metadata?.id || null;
            const cell_id = cell?.id || null;
            const cellKind =
                cell.kind === vscode.NotebookCellKind.Code
                    ? "code"
                    : "markdown";
            // console.log("EXPORT CELL:", commandId, cell_id, cell);
            await Cell.create(
                note.id,
                sessionId,
                cell_id,
                cell.value,
                cellKind,
            );
            // await Cell.create(note.id, sessionId, commandId, cell.value, cellKind);
        }
        return note;
    }
}
