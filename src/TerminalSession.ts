import * as vscode from 'vscode';
import { Logger } from './Logger';
import { XtermParser } from './XtermParser';
import { ParsedCommand } from './CommandParser';

/**
 * Enum representing the various operational states of the terminal session.
 * Used to track and handle the lifecycle of a session.
 */
export enum TerminalSessionMode {
	Start = "Start",
	CaptureStart = "CaptureStart",
	Capturing = "Capturing",
	CaptureStop = "CaptureStop",
	Close = "Close",
};

/**
 * TerminalSession manages the state, command tracking, and shell integration 
 * of a terminal session within VSCode. This includes managing session modes, 
 * buffering console output, and determining if shell integration is active.
 */
export class TerminalSession {
    // Records session start time
    start: Date = new Date();           
    // Unique identifier for the session
    sessionId: number = 0;
    // Session name
    sessionName?: string;
    // Unique identifier for the command within the session
    commandId: number = 0;              
    // Current operational mode of the session
    private _terminalSessionMode = TerminalSessionMode.Close;  

    startEventCommand?: string;

    // Buffer holding output data for the session
    consoleBuffer: string[]  = [];

    notebookEditor: vscode.NotebookEditor | undefined;
    xtermParser: XtermParser | undefined;
    parsedCommand: ParsedCommand | undefined;

    // Disables shell integration handler processing
    disableShellIntegrationHandlers: boolean = false;

    // Indicates whether a shell command is currently running. 
    // True if a command start event has been trrigerd but the end event has not yet. 
    // False when a command is being entered or not running.
    commandRunning: boolean = false;

    // Scheduled time for the next shell integration disable check notification
    nextNotification: Date | null = null;

    // True if a command start or end event has occurred during the interval period
    shellExecutionEventBusy: boolean = false;

    // Amount of terminal traffic measured as the byte count within the interval period
    terminalTraffic: number = 0;

    // Traffic threshold to consider as key input: if the traffic during the interval 
    // is below this value, it is treated as key input activity
    private readonly keyInputTrafficLimit = 50;

    // Suppression interval for shell integration disabled check: after a notification, 
    // checks within this interval (in milliseconds) will not trigger a new notification
    private readonly nextNotificationTime = 60000;

    /**
     * Determines if shell integration is inactive, based on the current session mode,
     * command execution status, and traffic threshold. Returns true if integration 
     * appears inactive.
     */
    public shellIntegrationNotActive() : boolean {
        if (this.terminalSessionMode !== TerminalSessionMode.CaptureStart) {
            return false;
        }
        Logger.debug(`Determines if shell integration is inactive: ${this.terminalTraffic}, ${this.shellExecutionEventBusy}`);
        if (this.terminalTraffic > this.keyInputTrafficLimit && !this.shellExecutionEventBusy) { 
            return true; 
        }
        return false;
    }

    /**
     * Checks if the session is in an active capturing state.
     */
    public captureActive() : boolean {
        // return (this.terminalSessionMode === TerminalSessionMode.Capturing || 
        //     this.terminalSessionMode === TerminalSessionMode.CaptureStart);
        return (this.terminalSessionMode === TerminalSessionMode.CaptureStart);
    }

    /**
     * Checks if the suppression interval has expired, allowing for a new notification.
     * @param now - The current time
     * @returns true if the current time is beyond the suppression interval.
     */
    public notificationSuppressionDeadline(now : Date) : boolean {
        Logger.debug(`notification suppression deadline check :${now} >= ${this.nextNotification}`);
        return (this.nextNotification === null || now >= this.nextNotification);
    }

    /**
     * Sets the next notification suppression deadline, calculating it from the current time
     * plus the suppression interval.
     * @param now - The current time
     */
    public setNextNotification(now: Date) {
        this.nextNotification = new Date(now.getTime() + this.nextNotificationTime);
    }

    /**
     * Transitions the session mode to Capturing if it is currently in CaptureStart,
     * and prepares for command execution tracking by resetting relevant states.
     * @param commandRunning - Boolean indicating whether a command is active.
     */
    public changeModeCapturing(commandRunning: boolean) {
        this.shellExecutionEventBusy = true;
        this.commandRunning = commandRunning;
        this.terminalTraffic = 0;
        if (this.terminalSessionMode === TerminalSessionMode.CaptureStart) {
            this.terminalSessionMode = TerminalSessionMode.Capturing;
        }
    }

    /**
     * Getter and setter for terminal session mode to enable managed access.
     */
    public get terminalSessionMode() {
        return this._terminalSessionMode;
    }

    public set terminalSessionMode(value) {
        this._terminalSessionMode = value;
    }
}
