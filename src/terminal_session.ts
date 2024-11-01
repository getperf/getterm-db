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

    sessionName?: string;
    consoleBuffer: string[]  = [];
    notebookEditor: vscode.NotebookEditor | undefined;
    xtermParser: XtermParser | undefined;
    parsedCommand: ParsedCommand | undefined;

    disableShellIntegrationHandlers: boolean = false;

    isShellIntegrationRunning: boolean = false;
    commandRunning: boolean = false;
    nextNotification: Date | null = null;

    shellExecutionEventBusy: boolean = false;
    terminalTraffic: number = 0;

    public shellIntegrationNotActive() : boolean {
        // return (this.terminalSessionMode === TerminalSessionMode.Capturing &&
        //     this.terminalTraffic &&
        //     !this.shellExecutionEventBusy
        // );
        // if (this.terminalSessionMode === TerminalSessionMode.Capturing &&
        //     !this.shellExecutionEventBusy
        // ) {
        if (this.captureActive()) {
            if (this.terminalTraffic > 100) { return true; }
        }
        return false;
    }

    public captureActive() : boolean {
        return (this.terminalSessionMode === TerminalSessionMode.Capturing || 
            this.terminalSessionMode === TerminalSessionMode.CaptureStart);
    }

    public notificationDeadline(now : Date) : boolean {
        return (this.nextNotification === null || now >= this.nextNotification);
    }

    public setNextNotification(now: Date) {
        this.nextNotification = new Date(now.getTime() + 30000); // 30秒後
    }

    public changeModeCapturing(commandRunning: boolean) {
        this.shellExecutionEventBusy = true;
        this.commandRunning = commandRunning;
        this.terminalTraffic = 0;
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
