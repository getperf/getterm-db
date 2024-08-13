import * as vscode from 'vscode';
import { SSHProvider } from './ssh_provider';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "getterm-db" is now active!');

	const disposable = vscode.commands.registerCommand('getterm-db.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from getterm-db!');
	});
	new SSHProvider(context);
}

export function deactivate() {}
