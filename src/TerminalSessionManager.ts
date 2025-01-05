import * as vscode from 'vscode';
import { Logger } from './Logger';
import { XtermParser } from './XtermParser';
import { TerminalSession, TerminalSessionMode } from './TerminalSession';
import { Session } from './model/Session';

export class TerminalSessionManager {
    private static instance: TerminalSessionManager | null = null;
    private static terminalSessions: Map<vscode.Terminal, TerminalSession> = new Map();
    private readonly monitorInterval = 2000;

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
        }, this.monitorInterval); // 5秒ごとに実行
    }

    private checkAllSessionStatus() {
        TerminalSessionManager.terminalSessions.forEach((session, terminal) => {
            console.log(`Terminal: ${terminal.name}, Mode: ${session.terminalSessionMode}, Traffic: ${session.terminalTraffic}, Run: ${session.commandRunning}, Active: ${session.shellIntegrationNotActive()}`);

            const now = new Date();
            if (session.shellIntegrationNotActive()) {
                console.log("シェル統合無効化検知：", session.notificationSuppressionDeadline(now));
                if (session.notificationSuppressionDeadline(now)) {
                    // vscode.window.showInformationMessage(
                    //     `シェル統合を有効化してください`
                    // );
                    vscode.window.showInformationMessage(
                        "シェル統合スクリプトを有効化してください",
                        "有効化手順"
                        // "https://code.visualstudio.com/docs/terminal/shell-integration#_manual-installation"
                    ).then((selection) => {
                        if (selection) {
                            vscode.env.openExternal(vscode.Uri.parse("https://code.visualstudio.com/docs/terminal/shell-integration#_manual-installation"));
                        }
                    });
                    console.log(
                        `シェル統合を有効化してください`
                    );
                    // session.nextNotification = new Date(now.getTime() + 30000); // 30秒後
                    session.setNextNotification(now);
                }
            }
            if (session.shellExecutionEventBusy) {
                session.nextNotification = null;
            }
            session.terminalTraffic = 0;
            session.shellExecutionEventBusy = false;
        });
    }

    static getSessionNew(terminal: vscode.Terminal): TerminalSession | undefined {
        return this.terminalSessions.get(terminal);
    }

    static getSession(terminal: vscode.Terminal): TerminalSession {
        const session = this.terminalSessions.get(terminal);
        if (!session) {
            throw new Error(`No session found for terminal: ${terminal.name}`);
        }
        return session;
    }

    static async getSessionOrCreate(terminal: vscode.Terminal): Promise<TerminalSession> {
        let session = this.terminalSessions.get(terminal);
        if (!session) {
            session = await this.create(terminal);
        }
        return session;
    }

    static async create(terminal: vscode.Terminal): Promise<TerminalSession> {
        const sessionId = await Session.create(terminal.name, 'Capture from existing terminal', [], '', '');
        // const session = await Session.getById(sessionId);
        const session = new TerminalSession();
        session.sessionId = sessionId;
        session.sessionName = terminal.name;
        session.terminalSessionMode = TerminalSessionMode.Start;
        Logger.info(`Created terminal session: ${sessionId}`);
        this.terminalSessions.set(terminal, session);
        return session;
    }

    public static updateSession<T extends keyof TerminalSession>(
        terminal: vscode.Terminal,
        key: T,
        value: TerminalSession[T]
    ): void {
        const session = this.getSession(terminal);
        session[key] = value;
        this.terminalSessions.set(terminal, session);
        // Logger.info(`Updated session ${key}: ${JSON.stringify(value, getCircularReplacer())}`);
        Logger.info(`Updated session ${key}: ${value}`);
    }

    public static retrieveDataBuffer(terminal: vscode.Terminal): string {
        const session = this.getSession(terminal);
        const dataBuffer = session.consoleBuffer?.join('');
        session.consoleBuffer = [];
        return dataBuffer || '';
    }

    public static pushDataBuffer(terminal: vscode.Terminal, data: string): number {
        const session = this.getSession(terminal);
        session.terminalTraffic += data.length;
        const bufferLen = session.consoleBuffer.push(data);
        Logger.info(`Appended data to buffer: ${data}`);
        return bufferLen;
    }

    public static disableShellIntegrationEvent(terminal: vscode.Terminal): void {
        this.updateSession(terminal, 'disableShellIntegrationHandlers', true);
    }

    public static enableShellIntegrationEvent(terminal: vscode.Terminal): void {
        this.updateSession(terminal, 'disableShellIntegrationHandlers', false);
    }

    public static getSessionName(terminal: vscode.Terminal): string {
        return this.getSession(terminal).sessionName || '';
    }

    public static getSessionId(terminal: vscode.Terminal): number {
        return this.getSession(terminal).sessionId;
    }

    public static getAllSessionLabels(): string[] {
        return Array.from(this.terminalSessions.keys()).map((terminal) => terminal.name);
    }

    public static findTerminalByName(name: string): vscode.Terminal | undefined {
        for (const [terminal] of this.terminalSessions.entries()) {
            if (terminal.name === name) {
                return terminal;
            }
        }
        return undefined;
    }

    public static findTerminalByNotebookEditor(notebookEditor: vscode.NotebookEditor | undefined): vscode.Terminal | undefined {
        if (!notebookEditor) {
            return undefined;
        }
        const terminals = vscode.window.terminals;
        for (const terminal of terminals) {
            const session = this.getSession(terminal);
            if (session && session.notebookEditor === notebookEditor) {
                return terminal;
            }
        }
        return undefined;
    }

}
