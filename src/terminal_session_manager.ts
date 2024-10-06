import * as vscode from 'vscode';
import { Logger } from './logger';
import { XtermParser } from './xterm_parser';
// import { EditedFileDownloader } from './edited_file_downloader';

class TerminalSession {
    start: Date = new Date();
    sessionId: number = 0;
    commandId: number = 0;
    dataBuffer: string[]  = [];
    notebookEditor: vscode.NotebookEditor | undefined;
    xtermParser: XtermParser | undefined;
    // editedFileDownloader: EditedFileDownloader | undefined;
    shellIntegrationEventDisabled: boolean = false;
    // updatingFlag : boolean = false;
    // UpdateFilePath : string | undefined;
}

export class TerminalSessionManager {
    private static terminalSessions: Map<vscode.Terminal, TerminalSession> = new Map();

    static setSessionId(terminal: vscode.Terminal, sessionId:number): TerminalSession {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.sessionId = sessionId;
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
        session.dataBuffer = dataBuffer;
        Logger.debug(`set terminal session manager data buffer : ${dataBuffer}`);
        this.terminalSessions.set(terminal, session);
        return session;
    }

    static setNotebookEditor(terminal: vscode.Terminal, notebookEditor: vscode.NotebookEditor|undefined) {
		// throw new Error('Method not implemented.');
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.notebookEditor = notebookEditor;
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
        session.shellIntegrationEventDisabled = true;
        Logger.info(`set terminal session manager shell integration event disable`);
        console.log("DisableFlag1(on):", session.shellIntegrationEventDisabled);
        this.terminalSessions.set(terminal, session);
        return session;
	}

    static enableShellIntegrationEvent(terminal: vscode.Terminal) {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.shellIntegrationEventDisabled = false;
        Logger.info(`set terminal session manager shell integration event enable`);
        console.log("DisableFlag2(off):", session.shellIntegrationEventDisabled);
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
        const bufferLen = session.dataBuffer.push(data);
        Logger.info(`append terminal session manager data buffer : ${data}`);
        this.terminalSessions.set(terminal, session);
        return bufferLen;
    }

    static pushDataBufferExcludingOpening(terminal: vscode.Terminal, data:string): number {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        const currentTime = new Date();
        const execDuration = (currentTime.getTime() - session.start.getTime()) / 1000; 
        console.log("EXEC DURATION : ", execDuration);
        if (execDuration < 1 || !terminal.shellIntegration) {
            Logger.warn(`skip data buffering for shell integration opening session. : ${execDuration}`);
            return 0;
        }
        return this.pushDataBuffer(terminal, data);
    }

    static retrieveDataBuffer(terminal: vscode.Terminal): string {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        const dataBuffer = session.dataBuffer?.join('');
        session.dataBuffer = [];
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
        return this.terminalSessions.get(terminal)?.dataBuffer;
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
        const flag = this.terminalSessions.get(terminal)?.shellIntegrationEventDisabled || false;
        console.log("DisableFlag3(is):", flag);
        return this.terminalSessions.get(terminal)?.shellIntegrationEventDisabled || false;
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
