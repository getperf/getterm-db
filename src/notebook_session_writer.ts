import * as vscode from 'vscode';
import { Logger } from './logger';

export interface SessionMetaData {
    hostName: string;
    startTime: Date | undefined;
    endTime: Date | undefined;
};

export class NotebookSessionWriter {
    
    public static appendSessionTitleCell(selectedSession: string) {
        console.log(`Method not implemented.${selectedSession}`);
        const sessionMetaData: SessionMetaData = {
            hostName: selectedSession,
            startTime: new Date(),
            endTime: undefined,
        };
        NotebookSessionWriter.addSessionDataToNotebook(sessionMetaData);
    }

    // Static method to add session data to the notebook
    public static async addSessionDataToNotebook(sessionData: SessionMetaData) {
        const activeNotebook = vscode.window.activeNotebookEditor;
        if (!activeNotebook) {
            vscode.window.showErrorMessage("No active notebook found.");
            return;
        }
        const notebookDocument = activeNotebook.notebook;
		const currentRow = notebookDocument.cellCount;

        const sessionMetaData = NotebookSessionWriter.sessionToPandocTitleBlock(sessionData);
        const markdownContent = `${sessionMetaData}\n\n### '${sessionData.hostName}' session start\n`;
        const newCell = new vscode.NotebookCellData(
            vscode.NotebookCellKind.Markup,
            markdownContent,
            'markdown'
        );

        Logger.info(`update notebook add cell at ${currentRow}`);
		const range = new vscode.NotebookRange(currentRow, currentRow + 1);
		const edit = new vscode.NotebookEdit(range, [newCell]);

		const workspaceEdit = new vscode.WorkspaceEdit();
		workspaceEdit.set(notebookDocument.uri, [edit]);
		await vscode.workspace.applyEdit(workspaceEdit);

        activeNotebook.selection = range;
		activeNotebook.revealRange(range, vscode.NotebookEditorRevealType.Default);
    }

    // Helper method to convert session data to YAML
    private static sessionToPandocTitleBlock(sessionData: SessionMetaData): string {
        let metaData = `% sshHost: "${sessionData.hostName}"\n`;
        if (sessionData.startTime) {
            metaData += `% startTime: "${sessionData.startTime.toLocaleString()}"\n`;
        }
        return metaData;
    }
}
