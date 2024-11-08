import * as vscode from 'vscode';
import { Logger } from './logger';

enum SessionMode {
    Sart = 'start',
    Closed = 'closed',
};

export interface SessionMetaData {
    hostName: string;
    sessionMode: SessionMode,
    startTime: Date | undefined;
    endTime: Date | undefined;
};

export class NotebookSessionWriter {
    
    public static appendSessionStartCell(selectedSession: string, notebook?: vscode.NotebookEditor | undefined) {
        const sessionMetaData: SessionMetaData = {
            hostName: selectedSession,
            sessionMode: SessionMode.Sart,
            startTime: new Date(),
            endTime: undefined,
        };
        NotebookSessionWriter.addSessionDataToNotebook(sessionMetaData, notebook);
    }

    public static appendSessionClosedCell(selectedSession: string, notebook?: vscode.NotebookEditor | undefined) {
        const sessionMetaData: SessionMetaData = {
            hostName: selectedSession,
            sessionMode: SessionMode.Closed,
            startTime: undefined,
            endTime: new Date(),
        };
        NotebookSessionWriter.addSessionDataToNotebook(sessionMetaData, notebook);
    }

    // Static method to add session data to the notebook
    public static async addSessionDataToNotebook(sessionData: SessionMetaData, notebook?: vscode.NotebookEditor | undefined) {
        const activeNotebook = notebook || vscode.window.activeNotebookEditor;
        if (!activeNotebook) {
            vscode.window.showErrorMessage("No active notebook found.");
            return;
        }
        const notebookDocument = activeNotebook.notebook;
		const currentRow = notebookDocument.cellCount;

        const sessionMetaData = NotebookSessionWriter.sessionToPandocTitleBlock(sessionData);
        const markdownContent = `${sessionMetaData}\n\n### '${sessionData.hostName}' session ${sessionData.sessionMode}\n`;
        const newCell = new vscode.NotebookCellData(
            vscode.NotebookCellKind.Markup,
            markdownContent,
            'markdown'
        );

        Logger.info(`update notebook add cell at ${currentRow}`);
		const range = new vscode.NotebookRange(currentRow, currentRow + 1);
		const edit = new vscode.NotebookEdit(range, [newCell]);

        // Update notebook metadata with sessionId
        // const newMetadata = { ...notebookDocument.metadata, sessionId: sessionData.sessionId };
        const newMetadata = { ...notebookDocument.metadata, sessionId: 12 };

        const workspaceEdit = new vscode.WorkspaceEdit();
        // workspaceEdit.replaceNotebookMetadata(notebookDocument.uri, newMetadata);
        // workspaceEdit.replace(notebookDocument.uri, new vscode.Range(0,0), "newText", newMetadata);
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
        if (sessionData.endTime) {
            metaData += `% endTime: "${sessionData.endTime.toLocaleString()}"\n`;
        }
        return metaData;
    }
}
