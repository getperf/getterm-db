import * as vscode from 'vscode';
import { SSHProvider } from './ssh_provider';
import { TerminalNotebookProvider } from './notebook_provider';
import { NotebookCopyButtonProvider } from './notebook_copy_button_provider';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "getterm-db" is now active!');

	const disposable = vscode.commands.registerCommand('getterm-db.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from getterm-db!');
	});
	const terminalNotebookProvider = new TerminalNotebookProvider(context);
    new NotebookCopyButtonProvider(context);
	new SSHProvider(context, terminalNotebookProvider.controller);
}

export function deactivate() {}
