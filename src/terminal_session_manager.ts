import * as vscode from 'vscode';

class TerminalSession {
    sessionId: number = 0;
    commandId: number = 0;
    dataBuffer: string[]  = [];
}

export class TerminalSessionManager {
    private static terminalSessions: Map<vscode.Terminal, TerminalSession> = new Map();

    static setSessionId(terminal: vscode.Terminal, sessionId:number): TerminalSession {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.sessionId = sessionId;
        this.terminalSessions.set(terminal, session);
        return session;
    }

    static setCommandId(terminal: vscode.Terminal, commandId:number): TerminalSession {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.commandId = commandId;
        this.terminalSessions.set(terminal, session);
        return session;
    }

    static setDataBuffer(terminal: vscode.Terminal, dataBuffer:string[]): TerminalSession {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        session.dataBuffer = dataBuffer;
        this.terminalSessions.set(terminal, session);
        return session;
    }

    static pushDataBuffer(terminal: vscode.Terminal, data:string): number {
        let session = this.terminalSessions.get(terminal) || new TerminalSession();
        const bufferLen = session.dataBuffer.push(data);
        this.terminalSessions.set(terminal, session);
        return bufferLen;
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
}
