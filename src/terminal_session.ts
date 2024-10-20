import * as vscode from 'vscode';
import { Logger } from './logger';
import { XtermParser } from './xterm_parser';
import { ParsedCommand } from './command_parser';

export enum TerminalSessionMode {
	Start = "Start",
	CaptureStart = "CaptureStart",
	Capturing = "Capturing",
	CaptureStop = "CaptureStop",
	Close = "Close",
};

export class TerminalSession {
    start: Date = new Date();
    sessionId: number = 0;
    commandId: number = 0;
    private _terminalSessionMode = TerminalSessionMode.Close;

    consoleBuffer: string[]  = [];
    notebookEditor: vscode.NotebookEditor | undefined;
    xtermParser: XtermParser | undefined;
    parsedCommand: ParsedCommand | undefined;

    disableShellIntegrationHandlers: boolean = false;

    isShellIntegrationRunning: boolean = false;
    nextNotification: Date | null = null;

    shellExecutionEventBusy: boolean = false;
    dataWriteEventBusy: boolean = false;

    public shellIntegrationNotActive() : boolean {
        return (this.terminalSessionMode === TerminalSessionMode.Capturing &&
            this.dataWriteEventBusy &&
            !this.shellExecutionEventBusy
        );
    }

    public notificationDeadline(now : Date) : boolean {
        return (this.nextNotification === null || now >= this.nextNotification);
    }

    public setNextNotification(now: Date) {
        this.nextNotification = new Date(now.getTime() + 30000); // 30秒後
    }

    public changeModeCapturing() {
        this.shellExecutionEventBusy = true;
        if (this.terminalSessionMode === TerminalSessionMode.CaptureStart) {
            this.terminalSessionMode = TerminalSessionMode.Capturing;
        }
    }

    public get terminalSessionMode() {
        return this._terminalSessionMode;
    }

    public set terminalSessionMode(value) {
        this._terminalSessionMode = value;
    }
}
