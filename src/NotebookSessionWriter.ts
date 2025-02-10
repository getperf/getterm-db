import * as vscode from "vscode";
import { Logger } from "./Logger";
import { TerminalSession } from "./TerminalSession";

enum SessionMode {
    Sart = "start",
    Closed = "closed",
}

export interface SessionMetaData {
    hostName: string;
    sessionId: number;
    sessionMode: SessionMode;
    currentTime: Date | undefined;
}

export class NotebookSessionWriter {
    public static appendSessionStartCell(
        session: TerminalSession,
        notebook?: vscode.NotebookEditor | undefined,
    ) {
        const sessionMetaData: SessionMetaData = {
            sessionId: session.sessionId,
            hostName: session.sessionName || "undefined",
            sessionMode: SessionMode.Sart,
            currentTime: new Date(),
        };
        NotebookSessionWriter.addSessionDataToNotebook(
            sessionMetaData,
            notebook,
        );
    }

    public static appendSessionClosedCell(
        session: TerminalSession,
        notebook?: vscode.NotebookEditor | undefined,
    ) {
        const sessionMetaData: SessionMetaData = {
            sessionId: session.sessionId,
            hostName: session.sessionName || "undefined",
            sessionMode: SessionMode.Closed,
            currentTime: new Date(),
        };
        NotebookSessionWriter.addSessionDataToNotebook(
            sessionMetaData,
            notebook,
        );
    }

    // Static method to add session data to the notebook
    public static async addSessionDataToNotebook(
        sessionData: SessionMetaData,
        notebook?: vscode.NotebookEditor | undefined,
    ) {
        const activeNotebook = notebook || vscode.window.activeNotebookEditor;
        if (!activeNotebook) {
            Logger.info(
                "Unable to record session information because no notebook is open."
            );
            return;
        }
        const notebookDocument = activeNotebook.notebook;
        const currentRow = notebookDocument.cellCount;

        const sessionMetaData =
            NotebookSessionWriter.sessionToPandocTitleBlock(sessionData);
        const markdownContent = `${sessionMetaData}\n\n### '${sessionData.hostName}' session ${sessionData.sessionMode}\n`;
        const newCell = new vscode.NotebookCellData(
            vscode.NotebookCellKind.Markup,
            markdownContent,
            "markdown",
        );

        Logger.info(`update notebook add cell at ${currentRow}`);
        const range = new vscode.NotebookRange(currentRow, currentRow + 1);
        const edit = new vscode.NotebookEdit(range, [newCell]);

        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(notebookDocument.uri, [edit]);
        await vscode.workspace.applyEdit(workspaceEdit);

        activeNotebook.selection = range;
        activeNotebook.revealRange(
            range,
            vscode.NotebookEditorRevealType.InCenter,
        );
    }

    // Helper method to convert session data to YAML
    private static sessionToPandocTitleBlock(
        sessionData: SessionMetaData,
    ): string {
        let metaData = `% sessionId: "${sessionData.sessionId}"\n`;
        metaData += `% sessionMode: "${sessionData.sessionMode}"\n`;
        if (sessionData.currentTime) {
            metaData += `% currentTime: "${sessionData.currentTime.toLocaleString()}"\n`;
        }
        return metaData;
    }
}
