import * as vscode from 'vscode';
import { Logger } from './logger';

class TerminalSession {
    start: Date = new Date();
    sessionId: number = 0;
    commandId: number = 0;
    dataBuffer: string[]  = [];
    notebookEditor: vscode.NotebookEditor | undefined;
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
