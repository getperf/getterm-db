import * as vscode from 'vscode';
import { Logger } from './logger';

export interface SessionData {
    hostName: string;
    startTime: Date;
    endTime: Date;
};

export class NotebookSessionWriter {
    
    // Static method to add session data to the notebook
    public static async addSessionDataToNotebook(sessionData: SessionData) {
        const activeNotebook = vscode.window.activeNotebookEditor;
        if (!activeNotebook) {
            vscode.window.showErrorMessage("No active notebook found.");
            return;
        }
        const notebookDocument = activeNotebook.notebook;
		const currentRow = notebookDocument.cellCount;

        const sessionYaml = NotebookSessionWriter.convertSessionToYaml(sessionData);
        const markdownContent = `---\n${sessionYaml}---\n\n# Session Info\n- **Host**: ${sessionData.hostName}\n- **Start Time**: ${sessionData.startTime.toISOString()}\n- **End Time**: ${sessionData.endTime.toISOString()}\n`;

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
    private static convertSessionToYaml(sessionData: SessionData): string {
        return `sshHost: "${sessionData.hostName}"\nstartTime: "${sessionData.startTime.toISOString()}"\nendTime: "${sessionData.endTime.toISOString()}"\n`;
    }
}
