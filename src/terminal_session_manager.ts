import * as vscode from 'vscode';
import { Logger } from './logger';
import { XtermParser } from './xterm_parser';
import { ParsedCommand } from './command_parser';
import { TerminalSession, TerminalSessionMode } from './terminal_session';

export class TerminalSessionManager {
    private static instance: TerminalSessionManager | null = null;
    private static terminalSessions: Map<vscode.Terminal, TerminalSession> = new Map();

    public static initializeInstance(): TerminalSessionManager {
        if (!this.instance) {
            this.instance = new TerminalSessionManager();
            this.instance.startMonitor();
        }
        return this.instance;
    }

    private startMonitor() {
        setInterval(() => {
            this.checkAllSessionStatus();
        }, 5000); // 5秒ごとに実行
    }

    private checkAllSessionStatus() {
        TerminalSessionManager.terminalSessions.forEach((session, terminal) => {
            console.log(`Terminal: ${terminal.name}, Mode: ${session.terminalSessionMode}, Busy: ${session.dataWriteEventBusy}, ${session.shellExecutionEventBusy}`);
            const now = new Date();
            if (session.shellIntegrationNotActive()) {
                // console.log("シェル統合無効化検知：", session.notificationDeadline(now));
                if (session.notificationDeadline(now)) {
                    vscode.window.showInformationMessage(
                        `シェル統合を有効化してください`
                    );
                    // session.nextNotification = new Date(now.getTime() + 30000); // 30秒後
                    session.setNextNotification(now);
                }
            }
            if (session.shellExecutionEventBusy) {
                session.nextNotification = null;
            }
            session.dataWriteEventBusy = false;
            session.shellExecutionEventBusy = false;
        });
    }

    static setSessionId(terminal: vscode.Terminal, sessionId:number): TerminalSession {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.sessionId = sessionId;
        session.terminalSessionMode = TerminalSessionMode.Start;
        Logger.info(`set terminal session manager session id : ${sessionId}`);
        this.terminalSessions.set(terminal, session);
        return session;
    }

    static setCommandId(terminal: vscode.Terminal, commandId:number): TerminalSession {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.commandId = commandId;
        Logger.info(`set terminal session manager command id : ${commandId}`);
        this.terminalSessions.set(terminal, session);
        return session;
    }

    static setDataBuffer(terminal: vscode.Terminal, dataBuffer:string[]): TerminalSession {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.consoleBuffer = dataBuffer;
        Logger.debug(`set terminal session manager data buffer : ${dataBuffer}`);
        this.terminalSessions.set(terminal, session);
        return session;
    }

    static setNotebookEditor(terminal: vscode.Terminal, notebookEditor: vscode.NotebookEditor|undefined) {
		// throw new Error('Method not implemented.');
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.notebookEditor = notebookEditor;
        session.terminalSessionMode = TerminalSessionMode.CaptureStart;
        const title = notebookEditor?.notebook.uri.fsPath;
        Logger.info(`set terminal session manager notebook editor : ${title}`);
        this.terminalSessions.set(terminal, session);
        return session;
	}

    static setXtermParser(terminal: vscode.Terminal, xtermParser: XtermParser|undefined) {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.xtermParser = xtermParser;
        Logger.info(`set terminal session manager xterm parser`);
        this.terminalSessions.set(terminal, session);
        return session;
	}

    // static setEditedFileDownloader(terminal: vscode.Terminal, editedFileDownloader: EditedFileDownloader|undefined) {
    //     let session = this.terminalSessions.get(terminal) || new TerminalSession();
    //     session.editedFileDownloader = editedFileDownloader;
    //     Logger.info(`set terminal session manager edited file downloader`);
    //     this.terminalSessions.set(terminal, session);
    //     return session;
	// }

    static disableShellIntegrationEvent(terminal: vscode.Terminal) {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.disableShellIntegrationHandlers = true;
        Logger.info(`set terminal session manager shell integration event disable`);
        console.log("DisableFlag1(on):", session.disableShellIntegrationHandlers);
        this.terminalSessions.set(terminal, session);
        return session;
	}

    static enableShellIntegrationEvent(terminal: vscode.Terminal) {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.disableShellIntegrationHandlers = false;
        Logger.info(`set terminal session manager shell integration event enable`);
        console.log("DisableFlag2(off):", session.disableShellIntegrationHandlers);
        this.terminalSessions.set(terminal, session);
        return session;
	}

    // static setUpdatingFlag(terminal: vscode.Terminal, updatingFlag: boolean) {
    //     let session = this.terminalSessions.get(terminal) || new TerminalSession();
    //     session.updatingFlag = updatingFlag;
    //     Logger.info(`set terminal session manager updating flag: ${updatingFlag}`);
    //     this.terminalSessions.set(terminal, session);
    //     return session;
	// }

    // static setUpdateFilePath(terminal: vscode.Terminal, updateFilePath: string | undefined) {
    //     let session = this.terminalSessions.get(terminal) || new TerminalSession();
    //     session.UpdateFilePath = updateFilePath;
    //     Logger.info(`set terminal session manager update file path: ${updateFilePath}`);
    //     this.terminalSessions.set(terminal, session);
    //     return session;
	// }

    static pushDataBuffer(terminal: vscode.Terminal, data:string): number {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.dataWriteEventBusy = true;
        const bufferLen = session.consoleBuffer.push(data);
        Logger.info(`append terminal session manager data buffer : ${data}`);
        this.terminalSessions.set(terminal, session);
        return bufferLen;
    }

    static pushDataBufferExcludingOpening(terminal: vscode.Terminal, data:string): number {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.dataWriteEventBusy = true;
        const currentTime = new Date();
        const execDuration = (currentTime.getTime() - session.start.getTime()) / 1000; 
        // console.log("EXEC DURATION : ", execDuration);
        if (execDuration < 1 || !terminal.shellIntegration) {
            Logger.warn(`skip data buffering for shell integration opening session. : ${execDuration}`);
            return 0;
        }
        return this.pushDataBuffer(terminal, data);
    }

    static retrieveDataBuffer(terminal: vscode.Terminal): string {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        const dataBuffer = session.consoleBuffer?.join('');
        session.consoleBuffer = [];
        this.terminalSessions.set(terminal, session);
        return dataBuffer;
    }

    static get(terminal: vscode.Terminal): TerminalSession|undefined {
        return this.terminalSessions.get(terminal);
    }

    static getSessionId(terminal: vscode.Terminal): number|undefined {
        return this.terminalSessions.get(terminal)?.sessionId;
    }

    static getCommandId(terminal: vscode.Terminal): number|undefined {
        return this.terminalSessions.get(terminal)?.commandId;
    }

    static getDataBuffer(terminal: vscode.Terminal): string[]|undefined {
        return this.terminalSessions.get(terminal)?.consoleBuffer;
    }

    static getNotebookEditor(terminal: vscode.Terminal): vscode.NotebookEditor|undefined {
        return this.terminalSessions.get(terminal)?.notebookEditor;
    }

    static getXtermParser(terminal: vscode.Terminal): XtermParser|undefined {
        return this.terminalSessions.get(terminal)?.xtermParser;
    }

    // static getEditedFileDownloader(terminal: vscode.Terminal): EditedFileDownloader|undefined {
    //     return this.terminalSessions.get(terminal)?.editedFileDownloader;
    // }

    static isShellIntegrationEventDisabled(terminal: vscode.Terminal): boolean {
        const flag = this.terminalSessions.get(terminal)?.disableShellIntegrationHandlers || false;
        console.log("DisableFlag3(is):", flag);
        return this.terminalSessions.get(terminal)?.disableShellIntegrationHandlers || false;
    }

    // static getUpdatingFlag(terminal: vscode.Terminal): boolean {
    //     return this.terminalSessions.get(terminal)?.updatingFlag || false;
    // }

    // static getUpdateFilePath(terminal: vscode.Terminal): string | undefined {
    //     return this.terminalSessions.get(terminal)?.UpdateFilePath;
    // }

    static async getSessionIdWithRetry(terminal: vscode.Terminal): Promise<number | undefined> {
        let retries = 3;
        let sessionId: number | undefined;
        
        while (retries > 0) {
            sessionId = this.getSessionId(terminal);
            if (sessionId !== undefined) { return sessionId; }
            retries--;
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100ms
        }
        return sessionId; // Will return undefined if retries are exhausted
    }

    static getAllSessionLabels(): string[] {
        const sessionLabels: string[] = [];
        TerminalSessionManager.terminalSessions.forEach((session, terminal) => {
            sessionLabels.push(terminal.name);
        });
        return sessionLabels;
    }

    static findTerminalByName(terminalName: string): vscode.Terminal | undefined {
        for (const [terminal, session] of TerminalSessionManager.terminalSessions.entries()) {
            if (terminal.name === terminalName) {
                return terminal;
            }
        }
        return undefined;  // Return undefined if no matching terminal name is found
    }

    static findTerminalByNotebookEditor(notebookEditor: vscode.NotebookEditor | undefined) {
        for (const [terminal, session] of TerminalSessionManager.terminalSessions.entries()) {
            if (session.notebookEditor === notebookEditor) {
                return terminal;
            }
        }
        return undefined;
    }

}
