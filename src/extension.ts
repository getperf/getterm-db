import * as vscode from 'vscode';
import { SSHProvider } from './ssh_provider';
import { TerminalNotebookProvider } from './notebook_provider';
import { NotebookCopyButtonProvider } from './notebook_copy_button_provider';
import { CellExecutionTimeProvider } from './notebook_execution_time_provider';
import { Logger } from './logger';

export function activate(context: vscode.ExtensionContext) {

	const outputChannel = vscode.window.createOutputChannel('getterm-osc');
	Logger.setup(outputChannel);

	const terminalNotebookProvider = new TerminalNotebookProvider(context);
    new NotebookCopyButtonProvider(context);
	new CellExecutionTimeProvider(context);
	new SSHProvider(context, terminalNotebookProvider.controller);
}

export function deactivate() {}
