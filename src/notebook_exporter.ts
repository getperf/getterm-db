import * as vscode from "vscode";
import { Note } from "./model/notes";
import { Cell } from "./model/cells";
import { RawNotebookCell, RawNotebookData, TerminalNotebookSerializer } from "./notebook_serializer";

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
      })
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
