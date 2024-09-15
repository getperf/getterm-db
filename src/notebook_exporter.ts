import * as vscode from "vscode";
import ExcelJS from 'exceljs';
import { Note } from "./model/notes";
import { Cell } from "./model/cells";
import * as fs from 'fs';
import path from 'path';
import { RawNotebookCell, RawNotebookData, TerminalNotebookSerializer } from "./notebook_serializer";
import { Util } from "./util";

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
      vscode.commands.registerCommand('workbench.action.files.save', async () => {
        if (!this.isSaving) {
          this.isSaving = true;

          console.log('Manual save detected!');
          await this.saveNotebookToDatabase();
          await vscode.commands.executeCommand('workbench.action.files.save');

          setTimeout(() => {
            this.isSaving = false;
          }, 500);
        }
      }),
      vscode.commands.registerCommand('getterm-db.reportTerminalNotebook', async () => {
        this.reportTerminalNotebook();
      }),
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
      const notebookData = TerminalNotebookSerializer.getNotebookData(document);
      await TerminalNotebookExporter.saveNotebook(notebookData, notebookTitle);
      console.log(`saveNotebookDB : ${notebookTitle}`);
    }
  }

  async reportTerminalNotebook() {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
    const document = vscode.window.activeNotebookEditor?.notebook;
    if (!document) {
      vscode.window.showErrorMessage("no active notebook editor found");
      return;
    }
    const notebookTitle = document.uri.path;
    const note = await Note.getByTitle(notebookTitle);
    if (!note) {
      vscode.window.showErrorMessage("オープン中のターミナルノートブックは保存されていません");
      return;
    }
    const notebookId = note.id;
    const rows = await Note.reportQuery(notebookId);
    // Create Excel Workbook and Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('note report');
    // Add Columns
    worksheet.columns = [
      { header: 'Position', key: 'position', width: 10 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Content', key: 'content', width: 40 },
      { header: 'Output', key: 'output', width: 40 },
      { header: 'Start Time', key: 'start', width: 20 },
      { header: 'End Time', key: 'end', width: 20 },
      { header: 'Exit Code', key: 'exit_code', width: 10 },
    ];

    for (const row of rows) {
      worksheet.addRow({
        position: row.position,
        type: row.type,
        content: row.content,
        output: row.output,
        start: row.start,
        end: row.end,
        exit_code: row.exit_code,
      });
    }

    // Write to Excel File
    // const filePath = `./notebook_${notebookId}_report.xlsx`;
    const filePath = path.join(workspaceRoot,  `notebook_${notebookId}_report.xlsx`);
    workbook.xlsx.writeFile(filePath)
        .then(() => {
          vscode.window.showInformationMessage(`Excel report saved to ${filePath}`);
        })
        .catch((err) => {
          vscode.window.showErrorMessage('Error writing Excel file:', err);
        });
    Util.openExcelFile(filePath);
  }

  static async saveNotebook(notebookData: RawNotebookData, notebookTitle: string) : Promise<Note> {
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
      const cell_id = cell?.id || null;
      const cellKind =
        cell.kind === vscode.NotebookCellKind.Code ? "code" : "markdown";
      await Cell.create(note.id, sessionId, cell_id, cell.value, cellKind);
    }
    return note;
  }
}
