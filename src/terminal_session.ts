import * as vscode from 'vscode';
import { Logger } from './logger';
import { XtermParser } from './xterm_parser';
import { ParsedCommand } from './osc633_parser';

export enum TerminalSessionMode {
	SessionStarted = "SessionStarted",
	Captured = "Captured",
	CaptureStopped = "CaptureStopped",
	SessionClosed = "SessionClosed",
};

export class TerminalSession {
    start: Date = new Date();
    sessionId: number = 0;
    commandId: number = 0;
    private _terminalSessionMode = TerminalSessionMode.SessionClosed;

    consoleBuffer: string[]  = [];
    notebookEditor: vscode.NotebookEditor | undefined;
    xtermParser: XtermParser | undefined;
    parsedCommand: ParsedCommand | undefined;

    disableShellIntegrationHandlers: boolean = false;

    isShellIntegrationRunning: boolean = false;
    isTerminalShellExecutionRunning: boolean = false;
    isTerminalTransferBusy: boolean = false;

    public get terminalSessionMode() {
        return this._terminalSessionMode;
    }

    public set terminalSessionMode(value) {
        this._terminalSessionMode = value;
    }
}
