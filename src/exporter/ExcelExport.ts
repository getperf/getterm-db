import * as vscode from "vscode";
import ExcelJS from "exceljs";
import { Note } from "../model/Note";
import { Cell } from "../model/Cell";
import {
    RawNotebookCell,
    RawNotebookData,
} from "../NotebookSerializer";
import { Util } from "../Util";
import { ExportParameters, MarkdownExport } from "./MarkdownExport";
import { ExcelExportModel } from "./ExcelExportModel";
import { ExportDialog } from "./ExportDialog";

export class ExcelExport {

    static async exportToExcel() {
        const document = vscode.window.activeNotebookEditor?.notebook;
        if (!document) {
            vscode.window.showErrorMessage("No active notebook editor found");
            return;
        }

        const notebookName = document.uri.path.split("/").pop() ?? "Untitled";

        const dialog = new ExportDialog(notebookName, 'excel');
        const params = await dialog.getExportParametersByDialog();
        if (!params) {
            vscode.window.showInformationMessage("Export canceled.");
            return;
        }
        // console.log("export dialog result:", params);

        const note = await Note.getByTitle(document.uri.path);
        if (!note) {
            vscode.window.showErrorMessage(
                "The open terminal notebook has not been saved",
            );
            return;
        }

        const rows = await Note.reportQuery(note.id);

        // Create Excel Workbook and Worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Note Report");

        // Add Columns
        ExcelExportModel.setWorksheetColumns(worksheet);

        let stepNo = 0;
        let description = '';
        for (const row of rows) {
            if (row.type !== "code") {
                if (row.content) {
                    description += row.content;
                }
                continue;
            }
            stepNo++;
            const startTime = new Date(row.start);
            const endTime = new Date(row.end);
            const durationFormatted = Util.calculateDuration(startTime, endTime);
            const textDescription = this.reformDescription(description, params);
            const richtextDescription = ExcelExportModel.md2RichText(textDescription);
            worksheet.addRow({
                position: stepNo,
                // session: row.profile_name ?? "-",
                description: richtextDescription,
                command: row.content,
                output: MarkdownExport.getOutputText(row.output, params.trimLineCount),
                start: Util.formatTime(startTime),
                end: Util.formatTime(endTime),
                duration: durationFormatted,
                exit_code: row.exit_code ?? "-",
                misc: '',
            });
            description = '';
        }

        // Format Rows and Cells
        worksheet.eachRow((row, rowIndex) => {
            row.eachCell((cell, colNumber) => {
                ExcelExportModel.formatCell(cell, colNumber, rowIndex);
            });
            ExcelExportModel.adjustRowHeight(row, rowIndex);
            ExcelExportModel.applyExitCodeFormatting(row, rowIndex);
        });
        if (!params.includeCommandInfo) {
            [5, 6, 7, 8].forEach((col) => {
                worksheet.getColumn(col).hidden = true;
            });
        }
        // Write to Excel File
        const filePath = params?.exportPath;
        if (!filePath) {
            vscode.window.showErrorMessage("No export path selected");
            return;
        }
        try {
            await workbook.xlsx.writeFile(filePath.fsPath);
            vscode.window.showInformationMessage(`Excel report saved to ${filePath}`);
            if (params.openMarkdown) {
                Util.openExcelFile(filePath.fsPath);
            }
        } catch (err) {
            vscode.window.showErrorMessage(`Error writing Excel file: ${err}`);
        }
    }

    static reformDescription(text: string, params: ExportParameters):string {
        const lines: string[] = [];
        text.split(/\n/).forEach( (line) => {
            if (line.startsWith("% ")) {
                if (params?.includeMetadata) {lines.push(line); }
            } else {
                lines.push(line);
            }
        });
        lines.push("");
        return lines.join("\n").trim();
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
