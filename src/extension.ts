import * as vscode from 'vscode';
import { SSHProvider } from './ssh_provider';
import { TerminalNotebookProvider } from './notebook_provider';
import { NotebookCopyButtonProvider } from './notebook_copy_button_provider';
import { CellExecutionTimeProvider } from './notebook_execution_time_provider';
import { Logger } from './logger';
import { TerminalNotebookSessionPicker } from './notebook_session_picker';
import { initializeDatabase } from './database';
import { RemoteShellExecutor } from './remote_shell_executor';
import { PowerShellExecutor } from './powershell_executor';
import { TerminalCaptureExecutor } from './terminal_capture_executor';

export function activate(context: vscode.ExtensionContext) {

	const outputChannel = vscode.window.createOutputChannel('getterm-osc');
	Logger.setup(outputChannel);
	initializeDatabase();
	const terminalNotebookProvider = new TerminalNotebookProvider(context);
    new NotebookCopyButtonProvider(context);
	new CellExecutionTimeProvider(context);
	new TerminalNotebookSessionPicker(context);
	new RemoteShellExecutor(context);
	new PowerShellExecutor(context);
	new TerminalCaptureExecutor(context);
	new SSHProvider(context, terminalNotebookProvider.controller);
}

export function deactivate() {}
