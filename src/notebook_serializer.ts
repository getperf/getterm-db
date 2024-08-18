import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';
import { Command } from './model/commands';
import { rejects } from 'assert';
import { Session } from './model/sessions';
import { initializeDatabase, Database } from './database';

interface RawNotebookData {
	cells: RawNotebookCell[];
    metadata?: { sessionId: number };
}

interface RawNotebookCell {
	language: string;
	value: string;
	id: number;
	kind: vscode.NotebookCellKind;
	editable?: boolean;
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
			console.error('Error parsing notebook:', error);
			rawData = { cells: [] };
		}
		console.log(`端末ノート読み込み : ${text}`);
        const sessionId = rawData.metadata?.sessionId;
		console.log(`端末ノート読み込み、セッションid : ${sessionId}`);
		let cells: Array<vscode.NotebookCellData> = [];
        // セッションid が登録されておらず、session.db にも履歴がない場合はエラーとする
        if (!sessionId) {
            const message = `セッションid不明のため、ノートを開けませんでした`;
			vscode.window.showErrorMessage(message);
            return new vscode.NotebookData(cells);
        }
        const session = Session.getById(sessionId);
        if (!session) {
            const message = `session.db からセッション情報を取得できませんでした`;
			vscode.window.showErrorMessage(message);
            return new vscode.NotebookData(cells);
        }
        const startTime = new Date().toISOString();
        // const text = new TextDecoder().decode(data);
        rawData.cells.forEach( item => {
            console.log("ITEM: ", item);
            const cell = new vscode.NotebookCellData(
                item.kind,
                item.value,
                item.language,
            );
            cell.metadata = {id : item.id};
            cells.push(cell);
        });
		console.log("Deserialize Cells:", cells);
        const notebookData = new vscode.NotebookData(cells);
		if (rawData.metadata?.sessionId) {
			notebookData.metadata = { custom: { sessionId: rawData.metadata.sessionId } };
		} else {
			// Set the start time to the current time if not present
			// notebookData.metadata = { custom: { startTime: new Date().toISOString() } };
		}
		return notebookData;
	}

	public async serializeNotebook(data: vscode.NotebookData, token: vscode.CancellationToken): Promise<Uint8Array> {
		// Map the Notebook data into the format we want to save the Notebook data as
		// const contents: RawNotebookData = { cells: [] };
		const contents: RawNotebookData = { 
			cells: [], 
			metadata: { sessionId: data.metadata?.custom?.sessionId }
		};
	
		for (const cell of data.cells) {
			const id = cell.metadata?.id;
			const newCell : RawNotebookCell = {
				kind: cell.kind,
				language: cell.languageId,
				id: id,
				value: cell.value
			};
			console.log(`Serialize Cell : ${newCell.id}`);
			contents.cells.push(newCell);
		}

		return new TextEncoder().encode(JSON.stringify(contents));
	}

}