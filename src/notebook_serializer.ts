import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';
import { Command } from './model/commands';

interface RawNotebookData {
	cells: RawNotebookCell[];
    metadata?: { startTime: string };
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
		console.log(`Deserialize notebook : ${text}`);
			
        const startTime = new Date().toISOString();
        // const text = new TextDecoder().decode(data);
		let cells: Array<vscode.NotebookCellData> = [];
		try {
			const rows = await Command.getAllBySessionId(23);
			rows.forEach(row => {
				console.log(`Value:${row.id}, ${row.command}`);
				const cell = new vscode.NotebookCellData(
					vscode.NotebookCellKind.Code,
					row.command,
					'command'
				);
				cell.metadata = {id : row.id};
				cells.push(cell);
			});
		} catch (error) {
			vscode.window.showErrorMessage(`コマンド履歴の検索に失敗しました: ${error}`);
		}
		console.log("Deserialize Cells:", cells);
        const notebookData = new vscode.NotebookData(cells);
		if (rawData.metadata?.startTime) {
			notebookData.metadata = { custom: { startTime: rawData.metadata.startTime } };
		} else {
			// Set the start time to the current time if not present
			notebookData.metadata = { custom: { startTime: new Date().toISOString() } };
		}
		return notebookData;
	}

	public async serializeNotebook(data: vscode.NotebookData, token: vscode.CancellationToken): Promise<Uint8Array> {
		// Map the Notebook data into the format we want to save the Notebook data as
		// const contents: RawNotebookData = { cells: [] };
		const contents: RawNotebookData = { 
			cells: [], 
			metadata: { startTime: data.metadata?.custom?.startTime }
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