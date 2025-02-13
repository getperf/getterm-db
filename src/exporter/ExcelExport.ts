import * as vscode from "vscode";
import ExcelJS from "exceljs";
import { Note } from "../model/Note";
import { Cell } from "../model/Cell";
import path from "path";
import {
    RawNotebookCell,
    RawNotebookData,
} from "../NotebookSerializer";
import { Util } from "../Util";
import { MarkdownExport } from "./MarkdownExport";
import { ExcelExportModel } from "./ExcelExportModel";
import { MarkdownExportDialog } from "./MarkdownExportDialog";

export class ExcelExport {

    static async exportToExcel() {
        const workspaceRoot =
            vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
        const document = vscode.window.activeNotebookEditor?.notebook;
        if (!document) {
            vscode.window.showErrorMessage("No active notebook editor found");
            return;
        }

        const notebookName = document.uri.path.split("/").pop() ?? "Untitled";
        // const defaultExportPath = vscode.Uri.file(`${notebookName.replace(/\.[^/.]+$/, "")}.md`);

        const dialog = new MarkdownExportDialog(notebookName, 'excel');
        const params = await dialog.getExportParametersByDialog();
        console.log("export dialog result:", params);

        const notebookPath = document.uri.path;
        const notebookTitle = path.basename(notebookPath, path.extname(notebookPath));

        const note = await Note.getByTitle(notebookPath);
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
            const durationFormatted = Util.calculateDuration(
                startTime,
                endTime,
            );
            // const output = MarkdownExport.getOutputText(Util.escapeXml(row.output), 5);
            const output = MarkdownExport.getOutputText(row.output, 5);
            worksheet.addRow({
                position: stepNo,
                session: row.profile_name ?? "-",
                description: description,
                command: Util.escapeXml(row.content),
                output: output,
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

        // Write to Excel File
        const filePath = path.join(
            workspaceRoot,
            `${notebookTitle}.xlsx`,
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
