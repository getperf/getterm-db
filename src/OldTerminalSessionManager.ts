import * as vscode from "vscode";
import { Logger } from "./Logger";
import { XtermParser } from "./XtermParser";
import { TerminalSession, TerminalSessionMode } from "./TerminalSession";
import { Session } from "./model/Session";

// export class TerminalSessionManager {
// private static instance: TerminalSessionManager | null = null;
// private static terminalSessions: Map<vscode.Terminal, TerminalSession> = new Map();
// private readonly monitorInterval = 2000;

// public static initializeInstance(): TerminalSessionManager {
//     if (!this.instance) {
//         this.instance = new TerminalSessionManager();
//         // this.instance.startMonitor();
//     }
//     return this.instance;
// }

// private startMonitor() {
//     setInterval(() => {
//         this.checkAllSessionStatus();
//     }, this.monitorInterval); // 5秒ごとに実行
// }

// private checkAllSessionStatus() {
//     TerminalSessionManager.terminalSessions.forEach((session, terminal) => {
//         console.log(`Terminal: ${terminal.name}, Mode: ${session.terminalSessionMode}, Traffic: ${session.terminalTraffic}, Run: ${session.commandRunning}, Active: ${session.shellIntegrationNotActive()}`);

//         const now = new Date();
//         if (session.shellIntegrationNotActive()) {
//             console.log("シェル統合無効化検知：", session.notificationSuppressionDeadline(now));
//             if (session.notificationSuppressionDeadline(now)) {
//                 // vscode.window.showInformationMessage(
//                 //     `シェル統合を有効化してください`
//                 // );
//                 vscode.window.showInformationMessage(
//                     "シェル統合スクリプトを有効化してください",
//                     "有効化手順"
//                     // "https://code.visualstudio.com/docs/terminal/shell-integration#_manual-installation"
//                 ).then((selection) => {
//                     if (selection) {
//                         vscode.env.openExternal(vscode.Uri.parse("https://code.visualstudio.com/docs/terminal/shell-integration#_manual-installation"));
//                     }
//                 });
//                 console.log(
//                     `シェル統合を有効化してください`
//                 );
//                 // session.nextNotification = new Date(now.getTime() + 30000); // 30秒後
//                 session.setNextNotification(now);
//             }
//         }
//         if (session.shellExecutionEventBusy) {
//             session.nextNotification = null;
//         }
//         session.terminalTraffic = 0;
//         session.shellExecutionEventBusy = false;
//     });
// }

// private static getSession(terminal: vscode.Terminal): TerminalSession {
//     const session = this.terminalSessions.get(terminal);
//     if (!session) {
//         throw new Error(`No session found for terminal: ${terminal.name}`);
//     }
//     return session;
// }

// static async create(terminal: vscode.Terminal): Promise<TerminalSession> {
//     const sessionId = await Session.create(terminal.name, 'Capture from existing terminal', [], '', '');
//     // const session = await Session.getById(sessionId);
//     const session = new TerminalSession();
//     session.sessionId = sessionId;
//     session.sessionName = terminal.name;
//     session.terminalSessionMode = TerminalSessionMode.Start;
//     Logger.info(`Created terminal session: ${sessionId}`);
//     this.terminalSessions.set(terminal, session);
//     return session;
//     // return TerminalSessionManager.setSessionId(terminal, sessionId);
// }

// static setSessionId(terminal: vscode.Terminal, sessionId:number): TerminalSession {
//     let session = this.terminalSessions.get(terminal) || new TerminalSession();
//     session.sessionId = sessionId;
//     session.sessionName = terminal.name;
//     session.terminalSessionMode = TerminalSessionMode.Start;
//     Logger.info(`set terminal session manager session id : ${sessionId}`);
//     this.terminalSessions.set(terminal, session);
//     return session;
// }

// static setCommandId(terminal: vscode.Terminal, commandId:number): TerminalSession {
//     let session = this.terminalSessions.get(terminal) || new TerminalSession();
//     session.commandId = commandId;
//     Logger.info(`set terminal session manager command id : ${commandId}`);
//     this.terminalSessions.set(terminal, session);
//     return session;
// }

// static setDataBuffer(terminal: vscode.Terminal, dataBuffer:string[]): TerminalSession {
//     let session = this.terminalSessions.get(terminal) || new TerminalSession();
//     session.consoleBuffer = dataBuffer;
//     Logger.debug(`set terminal session manager data buffer : ${dataBuffer}`);
//     this.terminalSessions.set(terminal, session);
//     return session;
// }

// static setNotebookEditor(terminal: vscode.Terminal, notebookEditor: vscode.NotebookEditor|undefined) {
// 	// throw new Error('Method not implemented.');
//     let session = this.terminalSessions.get(terminal) || new TerminalSession();
//     session.notebookEditor = notebookEditor;
//     session.terminalSessionMode = TerminalSessionMode.CaptureStart;
//     const title = notebookEditor?.notebook.uri.fsPath;
//     Logger.info(`set terminal session manager notebook editor : ${title}`);
//     this.terminalSessions.set(terminal, session);
//     return session;
// }

// static setXtermParser(terminal: vscode.Terminal, xtermParser: XtermParser|undefined) {
//     let session = this.terminalSessions.get(terminal) || new TerminalSession();
//     session.xtermParser = xtermParser;
//     Logger.info(`set terminal session manager xterm parser`);
//     this.terminalSessions.set(terminal, session);
//     return session;
// }

// static disableShellIntegrationEvent(terminal: vscode.Terminal) {
//     let session = this.terminalSessions.get(terminal) || new TerminalSession();
//     session.disableShellIntegrationHandlers = true;
//     Logger.info(`set terminal session manager shell integration event disable`);
//     console.log("DisableFlag1(on):", session.disableShellIntegrationHandlers);
//     this.terminalSessions.set(terminal, session);
//     return session;
// }

// static enableShellIntegrationEvent(terminal: vscode.Terminal) {
//     let session = this.terminalSessions.get(terminal) || new TerminalSession();
//     session.disableShellIntegrationHandlers = false;
//     Logger.info(`set terminal session manager shell integration event enable`);
//     console.log("DisableFlag2(off):", session.disableShellIntegrationHandlers);
//     this.terminalSessions.set(terminal, session);
//     return session;
// }

// static pushDataBuffer(terminal: vscode.Terminal, data:string): number {
//     let session = this.terminalSessions.get(terminal) || new TerminalSession();
//     session.terminalTraffic += data.length;
//     const bufferLen = session.consoleBuffer.push(data);
//     Logger.info(`append terminal session manager data buffer : ${JSON.stringify(data)}`);
//     this.terminalSessions.set(terminal, session);
//     return bufferLen;
// }

// static pushDataBufferExcludingOpening(terminal: vscode.Terminal, data:string): number {
//     let session = this.terminalSessions.get(terminal) || new TerminalSession();
//     session.terminalTraffic += data.length;
//     Logger.debug(`ConsoleData: ${data}`);
//     const currentTime = new Date();
//     const execDuration = (currentTime.getTime() - session.start.getTime()) / 1000;
//     // console.log("EXEC DURATION : ", execDuration);
//     if (execDuration < 1 || !terminal.shellIntegration) {
//         Logger.warn(`skip data buffering for shell integration opening session. : ${execDuration}`);
//         return 0;
//     }
//     return this.pushDataBuffer(terminal, data);
// }

// static retrieveDataBuffer(terminal: vscode.Terminal): string {
//     let session = this.terminalSessions.get(terminal) || new TerminalSession();
//     const dataBuffer = session.consoleBuffer?.join('');
//     session.consoleBuffer = [];
//     this.terminalSessions.set(terminal, session);
//     return dataBuffer;
// }

// static get(terminal: vscode.Terminal): TerminalSession|undefined {
//     return this.terminalSessions.get(terminal);
// }

// static getSessionName(terminal: vscode.Terminal): string|undefined {
//     return this.terminalSessions.get(terminal)?.sessionName;
// }

// static getSessionId(terminal: vscode.Terminal): number|undefined {
//     return this.terminalSessions.get(terminal)?.sessionId;
// }

// static getCommandId(terminal: vscode.Terminal): number|undefined {
//     return this.terminalSessions.get(terminal)?.commandId;
// }

// static getDataBuffer(terminal: vscode.Terminal): string[]|undefined {
//     return this.terminalSessions.get(terminal)?.consoleBuffer;
// }

// static getNotebookEditor(terminal: vscode.Terminal): vscode.NotebookEditor|undefined {
//     return this.terminalSessions.get(terminal)?.notebookEditor;
// }

// static getXtermParser(terminal: vscode.Terminal): XtermParser|undefined {
//     return this.terminalSessions.get(terminal)?.xtermParser;
// }

// static isShellIntegrationEventDisabled(terminal: vscode.Terminal): boolean {
//     const flag = this.terminalSessions.get(terminal)?.disableShellIntegrationHandlers || false;
//     console.log("DisableFlag3(is):", flag);
//     return this.terminalSessions.get(terminal)?.disableShellIntegrationHandlers || false;
// }

// static async getSessionIdWithRetry(terminal: vscode.Terminal): Promise<number | undefined> {
//     let retries = 3;
//     let sessionId: number | undefined;

//     while (retries > 0) {
//         sessionId = this.getSessionId(terminal);
//         if (sessionId !== undefined) { return sessionId; }
//         retries--;
//         await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100ms
//     }
//     return sessionId; // Will return undefined if retries are exhausted
// }

// static getAllSessionLabels(): string[] {
//     const sessionLabels: string[] = [];
//     TerminalSessionManager.terminalSessions.forEach((session, terminal) => {
//         sessionLabels.push(terminal.name);
//     });
//     return sessionLabels;
// }

// static findTerminalByName(terminalName: string): vscode.Terminal | undefined {
//     for (const [terminal, session] of TerminalSessionManager.terminalSessions.entries()) {
//         if (terminal.name === terminalName) {
//             return terminal;
//         }
//     }
//     return undefined;
// }

// static findByName(terminalName: string): TerminalSession | undefined {
//     for (const [terminal, session] of TerminalSessionManager.terminalSessions.entries()) {
//         if (terminal.name === terminalName) {
//             return session;
//         }
//     }
//     return undefined;
// }

// static findTerminalByNotebookEditor(notebookEditor: vscode.NotebookEditor | undefined) {
//     for (const [terminal, session] of TerminalSessionManager.terminalSessions.entries()) {
//         if (session.notebookEditor === notebookEditor) {
//             return terminal;
//         }
//     }
//     return undefined;
// }

// }
