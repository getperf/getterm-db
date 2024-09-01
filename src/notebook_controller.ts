import * as vscode from 'vscode';
import { SSHProvider } from './ssh_provider';
import path from 'path';
import { Command } from './model/commands';
import { NotebookCleaner } from './notebook_cleaner';
import { TerminalSessionManager } from './terminal_session_manager';
import { Logger } from './logger';
export const NOTEBOOK_TYPE = 'terminal-notebook';

export class TerminalNotebookController  {
	readonly controllerId = 'terminal-notebook-executor';
	readonly notebookType = NOTEBOOK_TYPE;
	readonly label = 'Terminal Notebook';
	readonly supportedLanguages = ['shellscript'];

    private readonly _controller: vscode.NotebookController;
	// private notebookCleaner: NotebookCleaner;
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
		// this.notebookCleaner = new NotebookCleaner(this);
	}

    async execute(cells: vscode.NotebookCell[]): Promise<void> {
		Logger.info("execute cell invoked.");
        for (const cell of cells) {
			await this.doExecution(cell);
        }
    }

	private async _execute(
		cells: vscode.NotebookCell[],
		_notebook: vscode.NotebookDocument,
		_controller: vscode.NotebookController
	): Promise<void> {
		Logger.info("_execute cell invoked.");
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
			Logger.debug('got cancellation request');
			(async () => {
				writeErr(execution, 'Query cancelled');
			})();
		});
		Logger.info(`execute cell at ${cell.index}, command id is ${cell.metadata.id}`);
        const row = await Command.getById(cell.metadata.id);
		if (row.exit_code === 0) {
			writeSuccess(execution, [[text(row.output)]]);
		} else {
			writeErr(execution, row.output);
		}
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
        // const sessionId = SSHProvider.getSessionIdForTerminal(activeTerminal);
		const sessionId = TerminalSessionManager.getSessionId(activeTerminal);
		if (!sessionId) {
            vscode.window.showInformationMessage('The terminal is not opened by Getterm.');
            return;
        }
        Logger.info(`create notebook, session id : ${sessionId}`);

        const terminalNotebookFilename = this.createTerminalNotebookFilename();
        Logger.info(`create notebook filename : ${terminalNotebookFilename}`);
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
			vscode.window.showInformationMessage(`Terminal notebook opend : ${newNotebookUri.fsPath}`);
			const notebookEditor = vscode.window.activeNotebookEditor;
			if (!notebookEditor) {
				throw new Error("active notebook editor not found.");
			}
			TerminalSessionManager.setNotebookEditor(activeTerminal, notebookEditor);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create or open new notebook: ${error}`);
		}
	}

	public async updateNotebook(rowid: number) {
        const activeTerminal = vscode.window.activeTerminal;
        if (!activeTerminal) {
            vscode.window.showInformationMessage('No active terminal is currently selected.');
            return;
        }
		// const notebookEditor = vscode.window.activeNotebookEditor;
		const notebookEditor = TerminalSessionManager.getNotebookEditor(activeTerminal);
		if (!notebookEditor) {
			vscode.window.showErrorMessage("no active notebook editor found!");
			return;
		}
		const sessionId = TerminalSessionManager.getSessionId(activeTerminal);
		if (!sessionId) {
            vscode.window.showInformationMessage('The terminal is not opened by Getterm.');
            return;
        }
        Logger.info(`update notebook session id : ${sessionId} , command id : ${rowid}`);

		// NotebookCleaner.cleanupUnusedCells();
		const notebookDocument = notebookEditor.notebook;
		const currentRow = notebookDocument.cellCount;
 	
		const row = await Command.getById(rowid);
        Logger.info(`update notebook add cell command : ${row.command}`);
		const newCell = new vscode.NotebookCellData(
			vscode.NotebookCellKind.Code,
			row.command,
			'shellscript'
		);
		// Set metadata with a unique ID
		// const newCellId = this.generateUniqueId();
		newCell.metadata = { id: rowid };

        Logger.info(`update notebook add cell at ${currentRow}`);
		const range = new vscode.NotebookRange(currentRow, currentRow + 1);
		const edit = new vscode.NotebookEdit(range, [newCell]);

		const workspaceEdit = new vscode.WorkspaceEdit();
		workspaceEdit.set(notebookDocument.uri, [edit]);
		await vscode.workspace.applyEdit(workspaceEdit);

		notebookEditor.selection = range;
		notebookEditor.revealRange(range, vscode.NotebookEditorRevealType.Default);

		// Get the index of the newly added cell
		// const addedCell = notebookDocument.cellAt(currentRow);
		// this.execute([addedCell]);
        Logger.info(`update notebook execute cell at ${currentRow}`);
		await vscode.commands.executeCommand('notebook.cell.execute', 
			{ ranges: [{ start: currentRow, end: currentRow + 1 }] }
		);

		notebookEditor.selection = range;
		notebookEditor.revealRange(range, vscode.NotebookEditorRevealType.Default);
	}

	dispose() {
		// globalConnPool.pool?.end();
	}

}

function writeErr(execution: vscode.NotebookCellExecution, err: string) {
	const redTextErr = `\u001b[31m${err}\u001b[0m`;
	execution.replaceOutput([
		new vscode.NotebookCellOutput([
			vscode.NotebookCellOutputItem.text(redTextErr),
		]),
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
