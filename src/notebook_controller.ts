import * as vscode from 'vscode';
import { SSHProvider } from './ssh_provider';
import path from 'path';
import { Command } from './model/commands';
export const NOTEBOOK_TYPE = 'terminal-notebook';

export class TerminalNotebookController  {
	readonly controllerId = 'terminal-notebook-executor';
	readonly notebookType = NOTEBOOK_TYPE;
	readonly label = 'Terminal Notebook';
	readonly supportedLanguages = ['shellscript'];

    private readonly _controller: vscode.NotebookController;
	private _executionOrder = 0;

	constructor() {
		this._controller = vscode.notebooks.createNotebookController(
		  this.controllerId,
		  this.notebookType,
		  this.label
		);
	
		this._controller.supportedLanguages = this.supportedLanguages;
		this._controller.supportsExecutionOrder = true;
		this._controller.executeHandler = this._execute.bind(this);
	}

    async execute(cells: vscode.NotebookCell[]): Promise<void> {
        for (const cell of cells) {
			await this.doExecution(cell);
        }
    }

	private async _execute(
		cells: vscode.NotebookCell[],
		_notebook: vscode.NotebookDocument,
		_controller: vscode.NotebookController
	): Promise<void> {
		for (let cell of cells) {
			// run each cell sequentially, awaiting its completion
			await this.doExecution(cell);
		}
	}

    private async doExecution(cell: vscode.NotebookCell): Promise<void> {
		const execution = this._controller.createNotebookCellExecution(cell);
		execution.executionOrder = ++this._executionOrder;
		execution.start(Date.now());
	
		execution.token.onCancellationRequested(() => {
			console.debug('got cancellation request');
			(async () => {
				writeErr(execution, 'Query cancelled');
			})();
		});
		console.log("INDEX:", cell.index, cell.metadata.id);
        const row = await Command.getById(cell.metadata.id);
		writeSuccess(
			execution,
			[[text(row.output)]]
		);
	}

    private createTerminalNotebookFilename(): string {
        const now = new Date();
        const yyyymmdd = now.toISOString().split('T')[0].replace(/-/g, '');
        const hhmiss = now.toTimeString().split(' ')[0].replace(/:/g, '');
        
        return `session_${yyyymmdd}_${hhmiss}.getterm`;
    }
    
	public async createNotebook() {
        const activeTerminal = vscode.window.activeTerminal;
        if (!activeTerminal) {
            vscode.window.showInformationMessage('No active terminal is currently selected.');
            return;
        }
        const sessionId = SSHProvider.getSessionIdForTerminal(activeTerminal);
        if (!sessionId) {
            vscode.window.showInformationMessage('The terminal is not opened by Getterm.');
            return;
        }
        console.log("Active terminal : ", sessionId);

        const terminalNotebookFilename = this.createTerminalNotebookFilename();
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
        const terminalNotebookFilePath = path.join(workspaceRoot, terminalNotebookFilename);
    
        const newNotebookUri = vscode.Uri.file(terminalNotebookFilePath);
		try {
			const newNotebookData = { 
                cells: [],
                metadata: { sessionId: sessionId }
            };
			await vscode.workspace.fs.writeFile(newNotebookUri, Buffer.from(JSON.stringify(newNotebookData)));
			await vscode.commands.executeCommand('vscode.openWith', newNotebookUri, NOTEBOOK_TYPE);
			vscode.window.showInformationMessage(`端末ノートを開きました: ${newNotebookUri.fsPath}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create or open new notebook: ${error}`);
		}
	}

	public async updateNotebook(rowid: number) {
		const notebookEditor = vscode.window.activeNotebookEditor;
		if (!notebookEditor) {
			vscode.window.showErrorMessage("No active notebook editor found!");
			return;
		}
		const activeCell = notebookEditor.selections[0]; // Get the currently active cell
		if (activeCell && activeCell.isEmpty) { // Check if the cell is empty
			console.log("DELETE CELL:", activeCell);
			// notebookEditor.notebook.
		//   notebookEditor.notebook.deleteCell(activeCell.index); // Delete the empty cell
		}
	
		const notebookDocument = notebookEditor.notebook;
		const currentRow = notebookDocument.cellCount;

		const row = await Command.getById(rowid);
		const newCell = new vscode.NotebookCellData(
			vscode.NotebookCellKind.Code,
			row.command,
			'shellscript'
		);
		// Set metadata with a unique ID
		// const newCellId = this.generateUniqueId();
		newCell.metadata = { id: rowid };

		const range = new vscode.NotebookRange(currentRow, currentRow + 1);
		const edit = new vscode.NotebookEdit(range, [newCell]);

		const workspaceEdit = new vscode.WorkspaceEdit();
		workspaceEdit.set(notebookDocument.uri, [edit]);
		await vscode.workspace.applyEdit(workspaceEdit);

		notebookEditor.selection = range;
		notebookEditor.revealRange(range, vscode.NotebookEditorRevealType.Default);

		// Get the index of the newly added cell
		const addedCell = notebookDocument.cellAt(currentRow);
		this.execute([addedCell]);

		notebookEditor.selection = range;
		notebookEditor.revealRange(range, vscode.NotebookEditorRevealType.Default);
	}

	dispose() {
		// globalConnPool.pool?.end();
	}

}

function writeErr(execution: vscode.NotebookCellExecution, err: string) {
	execution.replaceOutput([
	  new vscode.NotebookCellOutput([vscode.NotebookCellOutputItem.text(err)]),
	]);
	execution.end(false, Date.now());
  }
  
  const { text, json } = vscode.NotebookCellOutputItem;
  
  function writeSuccess(
	execution: vscode.NotebookCellExecution,
	outputs: vscode.NotebookCellOutputItem[][]
  ) {
	execution.replaceOutput(
	  outputs.map((items) => new vscode.NotebookCellOutput(items))
	);
	execution.end(true, Date.now());
}
