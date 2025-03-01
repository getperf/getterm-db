import * as vscode from "vscode";
import { ConsoleEventProvider } from "./ConsoleEventProvider";
import { TerminalNotebookProvider } from "./NotebookProvider";
import { NotebookCopyButtonProvider } from "./NotebookCopyButtonProvider";
import { CellExecutionTimeProvider } from "./NotebookExecutionTimeProvider";
import { Logger } from "./Logger";
import { TerminalNotebookSessionPicker } from "./NotebookSessionPicker";
import { RemoteShellExecutor } from "./RemoteShellExecutor";
import { PowerShellExecutor } from "./PowershellExecutor";
import { TerminalCaptureExecutor } from "./TerminalCaptureExecutor";
import { TerminalNotebookExporter } from "./NotebookExporter";
import { ConfigManager } from "./ConfigManager";
import { DatabaseManager } from "./DatabaseManager";
import { TerminalSessionManager } from "./TerminalSessionManager";
import { NotebookMarkdownCellAdder } from "./NotebookMarkdownCellAdder";
import { SSHConfigProvider } from "./SSHConfigProvider";

export async function activate(context: vscode.ExtensionContext) {
    ConfigManager.initialize(context);
    Logger.setup(vscode.window.createOutputChannel("getterm-log"), context);

    await DatabaseManager.initialize();
    TerminalSessionManager.initializeInstance();

    new SSHConfigProvider(context);
    const terminalNotebookProvider = new TerminalNotebookProvider(context);
    new NotebookCopyButtonProvider(context);
    new NotebookMarkdownCellAdder(context);
    new CellExecutionTimeProvider(context);
    new TerminalNotebookSessionPicker(context);
    new RemoteShellExecutor(context);
    new PowerShellExecutor(context);
    new TerminalCaptureExecutor(context);
    new TerminalNotebookExporter(context);
    new ConsoleEventProvider(context, terminalNotebookProvider.controller);
}

export function deactivate() {}
