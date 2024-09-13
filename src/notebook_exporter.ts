import * as vscode from "vscode";
import { Note } from "./model/notes";
import { Cell } from "./model/cells";
import { RawNotebookCell, RawNotebookData } from "./notebook_serializer";

export class TerminalNotebookExporter {
  static async saveNotebook(
    notebookData: RawNotebookData,
    notebookTitle: string
  ) {
    const sessionId = notebookData.metadata?.sessionId || null;

    // const existingNote = await Note.getByTitle(notebookTitle);
    // if (existingNote) {
    //   await Note.delete(existingNote.id);
    //   await Cell.deleteByNotebookId(existingNote.id);
    // }
    // const note = await Note.create(notebookTitle);
    // for (let i = 0; i < notebookData.cells.length; i++) {
    //   const cell: RawNotebookCell = notebookData.cells[i];
    //   const cell_id = cell?.id || null;
    //   const cellKind =
    //     cell.kind === vscode.NotebookCellKind.Code ? "code" : "markdown";
    //   await Cell.create(note.id, sessionId, cell_id, cell.value, cellKind);
    // }
    // return note;
  }
}
