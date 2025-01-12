import * as vscode from "vscode";
import path from "path";
import { ConfigManager } from "./ConfigManager";
import { Logger } from "./Logger";
import { CommandRow } from "./model/Command";

export class TerminalNotebookHandler {
    private notebookEditor: vscode.NotebookEditor | undefined;

    constructor(notebookEditor?: vscode.NotebookEditor) {
        this.notebookEditor = notebookEditor;
    }

    /**
     * Factory method to create an instance of TerminalNotebookHandler.
     * @param notebookEditor Optional notebook editor for existing notebooks.
     */
    static create(
        notebookEditor?: vscode.NotebookEditor,
    ): TerminalNotebookHandler {
        return new TerminalNotebookHandler(notebookEditor);
    }

    /**
     * Returns the default URI for saving a new terminal notebook.
     */
    defaultUri(lastSavePath?: vscode.Uri | undefined): vscode.Uri {
        const now = new Date();
        const yyyymmdd = now.toISOString().split("T")[0].replace(/-/g, "");
        const hhmiss = now.toTimeString().split(" ")[0].replace(/:/g, "");
        const filename = `note_${yyyymmdd}_${hhmiss}.getterm`;
        let notebookHome = ConfigManager.notebookHome;
        if (lastSavePath) {
            const lastSaveDir = path.dirname(lastSavePath.fsPath);
            if (lastSaveDir.startsWith(notebookHome)) {
                notebookHome = lastSaveDir;
            } else {
                Logger.info(
                    `Last save path '${lastSaveDir}' does not match notebookHome '${notebookHome}'. notebookHome remains unchanged.`
                );
            }
        }
    
        const filePath = path.join(notebookHome, filename);

        Logger.info(`Default notebook URI: ${filePath}`);
        return vscode.Uri.file(filePath);
    }

    /**
     * Creates an empty notebook structure.
     */
    createEmptyNotebook(): object {
        return {
            cells: [],
        };
    }

    /**
     * Inserts a new cell into the notebook based on a command retrieved by row ID.
     * @param row Row data containing the command.
     */
    async insertCommandCell(row: CommandRow): Promise<void> {
        if (!this.notebookEditor) {
            throw new Error("Notebook editor is not set.");
        }

        const notebookDocument = this.notebookEditor.notebook;
        const currentRow = notebookDocument.cellCount;

        Logger.info(`Adding cell with command: ${row.command}`);

        const newCell = new vscode.NotebookCellData(
            vscode.NotebookCellKind.Code,
            row.command,
            "shellscript",
        );
        newCell.metadata = { id: row.id };

        const range = new vscode.NotebookRange(currentRow, currentRow + 1);
        const edit = new vscode.NotebookEdit(range, [newCell]);

        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(notebookDocument.uri, [edit]);

        const applied = await vscode.workspace.applyEdit(workspaceEdit);
        if (!applied) {
            throw new Error("Failed to apply notebook edit.");
        }

        this.notebookEditor.selection = range;
        this.notebookEditor.revealRange(
            range,
            vscode.NotebookEditorRevealType.Default,
        );

        // Execute the newly added cell
        await vscode.commands.executeCommand("notebook.cell.execute", {
            ranges: [{ start: currentRow, end: currentRow + 1 }],
        });

        Logger.info(`Cell added and executed at index: ${currentRow}`);
    }
}
