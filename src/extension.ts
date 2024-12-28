import * as vscode from 'vscode';
import { ConsoleEventProvider } from './console_event_provider';
import { TerminalNotebookProvider } from './notebook_provider';
import { NotebookCopyButtonProvider } from './notebook_copy_button_provider';
import { CellExecutionTimeProvider } from './notebook_execution_time_provider';
import { Logger, LogLevel } from './logger';
import { TerminalNotebookSessionPicker } from './notebook_session_picker';
import { initializeDatabase } from './database';
import { RemoteShellExecutor } from './remote_shell_executor';
import { PowerShellExecutor } from './powershell_executor';
import { TerminalCaptureExecutor } from './terminal_capture_executor';
import { TerminalNotebookExporter } from './notebook_exporter';
import { TerminalSessionManager } from './terminal_session_manager';
import { WorkspaceManager } from './workspace_manager';
import { ConfigManager } from './config_manager';

export async function activate(context: vscode.ExtensionContext) {
    ConfigManager.initialize(context);
	Logger.setup(vscode.window.createOutputChannel('getterm-log'), context);
	// Logger.setLogLevel(LogLevel.DEBUG);
    // const workspaceReady = await WorkspaceManager.ensureWorkspaceIsOpen();
    // if (!workspaceReady) {
    //     vscode.window.showErrorMessage('ワークスペースが開いていません');
    //     return Promise.reject(new Error('Workspace not opened.'));
    // }

	await initializeDatabase();
	TerminalSessionManager.initializeInstance();
	const terminalNotebookProvider = new TerminalNotebookProvider(context);
    new NotebookCopyButtonProvider(context);
	new CellExecutionTimeProvider(context);
	new TerminalNotebookSessionPicker(context);
	new RemoteShellExecutor(context);
	new PowerShellExecutor(context);
	new TerminalCaptureExecutor(context);
	new TerminalNotebookExporter(context);
	new ConsoleEventProvider(context, terminalNotebookProvider.controller);
}

export function deactivate() {}
