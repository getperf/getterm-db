import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';
import { Command } from './model/Command';
import { rejects } from 'assert';
import { Session } from './model/Session';
// import { initializeDatabase, Database } from './Database';
import { Logger } from './Logger';
import { TerminalNotebookExporter } from './NotebookExporter';
import { Util } from './Util';

export interface RawNotebookData {
	cells: RawNotebookCell[];
    metadata?: { sessionId: number };
}

export interface RawNotebookCell {
	language: string;
	value: string;
	id?: number;
	kind: vscode.NotebookCellKind;
	editable?: boolean;
    // metadata?: { id: number };
}

interface Cmd {
	id: number;
	command: string;
	out: string;
}

export class TerminalNotebookSerializer implements vscode.NotebookSerializer {
	public readonly label: string = 'My Sample Content Serializer';

	public async deserializeNotebook(data: Uint8Array, token: vscode.CancellationToken): Promise<vscode.NotebookData> {
		const text = new TextDecoder().decode(data);
		let rawData: RawNotebookData;
		try {
			rawData = JSON.parse(text);
		} catch (error) {
			Logger.error(`Initialize notebook because parse failed : ${error}`);
			rawData = { cells: [] };
		}
        // const sessionId = rawData.metadata?.sessionId;
		// Logger.info(`initialize notebook, session id : ${sessionId}`);
		let cells: Array<vscode.NotebookCellData> = [];
        // セッションid が登録されておらず、session.db にも履歴がない場合はエラーとする
        // if (!sessionId) {
        //     const message = `The notebook could not be opened because the session was unknown.`;
		// 	vscode.window.showErrorMessage(message);
        //     return new vscode.NotebookData(cells);
        // }
        // const session = Session.getById(sessionId);
        // if (!session) {
        //     const message = `The note could not be opened because the session was not registered in the DB.`;
		// 	vscode.window.showErrorMessage(message);
        //     return new vscode.NotebookData(cells);
        // }
        const startTime = new Date().toISOString();
        rawData.cells.forEach( item => {
            const cell = new vscode.NotebookCellData(
                item.kind,
                item.value,
                item.language,
            );
			const commandId = item.id;
			if (commandId) {
				Logger.info(`read cell command id : ${item.id}`);
				cell.metadata = {id : item.id};
			} else {
				Logger.info(`read cell comment`);
			}
            cells.push(cell);
        });
        const notebookData = new vscode.NotebookData(cells);
		// if (sessionId) {
		// 	Logger.info(`set session id in notebook : ${sessionId}`);
		// 	notebookData.metadata = { custom: { sessionId: sessionId } };
		// } else {
		// 	// Set the start time to the current time if not present
		// 	// notebookData.metadata = { custom: { startTime: new Date().toISOString() } };
		// }
		return notebookData;
	}

	public static getNotebookData(notebook: vscode.NotebookDocument): RawNotebookData {
		const sessionId = notebook.metadata?.custom?.sessionId;
		Logger.info(`serialize notebook document, session id : ${sessionId}`);
		const contents: RawNotebookData = { 
			cells: [], 
			metadata: { sessionId: sessionId }
		};
		for (const cell of notebook.getCells()) {
			const id = cell.metadata?.id;
			const newCell : RawNotebookCell = {
				kind: cell.kind,
				language: cell.document.languageId,
				id: id,
				value: cell.document.getText()
			};
			console.log("CELL:", newCell);
			contents.cells.push(newCell);
		}
		return contents;

		// const cells = notebook.getCells().map(cell => ({
		// 	id: cell.metadata.custom.id,
		// 	kind: cell.kind,
		// 	value: cell.document.getText(),
		// 	language: cell.document.languageId
		// }));
	
		// return {
		// 	cells: cells,
		// 	metadata: {
		// 		sessionId: notebook.metadata?.sessionId || null
		// 	}
		// };
	}
	
	public static serializeNotebookData(data: vscode.NotebookData): RawNotebookData {
		// Map the Notebook data into the format we want to save the Notebook data as
		// const contents: RawNotebookData = { cells: [] };
		const sessionId = data.metadata?.custom?.sessionId;
		// Logger.info(`serialize notebook, session id : ${sessionId}`);
		Logger.info(`serialize notebook handler`);
		const contents: RawNotebookData = { 
			cells: [], 
			metadata: { sessionId: sessionId }
		};
	
		for (const cell of data.cells) {
			const id = cell.metadata?.id;
			const newCell : RawNotebookCell = {
				kind: cell.kind,
				language: cell.languageId,
				id: id,
				value: cell.value
			};
			contents.cells.push(newCell);
		}
		return contents;
	}

	public async serializeNotebook(data: vscode.NotebookData, token: vscode.CancellationToken): Promise<Uint8Array> {
		// Map the Notebook data into the format we want to save the Notebook data as
		// const contents: RawNotebookData = { cells: [] };
		// const sessionId = data.metadata?.custom?.sessionId;
		// Logger.info(`serialize notebook, session id : ${sessionId}`);
		const contents = TerminalNotebookSerializer.serializeNotebookData(data);
		Logger.info(`serialize notebook`);
		// const title = Util.getActiveNotebookFileName();
		// if (title) {
		// 	TerminalNotebookExporter.saveNotebook(contents, title);
		// }
		return new TextEncoder().encode(JSON.stringify(contents));
	}

}