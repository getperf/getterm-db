import * as vscode from "vscode";
import { Note } from "./model/Note";
import { Cell } from "./model/Cell";
import {
    RawNotebookCell,
    RawNotebookData,
    TerminalNotebookSerializer,
} from "./NotebookSerializer";
import { MarkdownExport } from "./exporter/MarkdownExport";
import { ExcelExport } from "./exporter/ExcelExport";

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
            vscode.commands.registerCommand(
                "getterm-db.exportExcel",
                async () => {
                    await this.saveNotebookToDatabase();
                    ExcelExport.exportToExcel();
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
