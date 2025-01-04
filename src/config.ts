// import * as vscode from 'vscode';
// import * as fs from 'fs';
// import * as path from 'path';
// import { Logger } from './Logger';
// import { Note } from './model/Note';

// export const SessionDb = 'session.db';
// export const ConfigFile = 'config.json';
// export const ConfigVersion = '1.0';
// export const NotebookHome = 'notebook';
// export const DownloadHome = 'download';

// interface Settings {
//     sqliteDbPath?: string;
//     notebookHome?: string;
//     downloadHome?: string;
//     terminalProfiles?: string[];
//     version?: string;
// }

// export class Config {
//     private static instance: Config;
//     private settings: Settings = {};
//     private configFilePath: string;
//     private gettermHome: string;

//     private constructor() {
//         const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
//         this.configFilePath = path.join(workspaceRoot, ConfigFile);
//         this.gettermHome = this.getGettermHome();
//         // this.configFilePath = path.join(this.gettermHome, ConfigFile);

//         // this.ensureDirectoryExists(); // Create .getterm directory if it doesn’t exist
//         // this.loadSettings();
//         // this.registerFileSystemWatcher();
//     }

//     // Retrieve the path for the .getterm directory
//     public getGettermHome(): string {
//         const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
//         return path.join(workspaceRoot, '.getterm');
//     }

//     // Ensure the .getterm directory exists
//     private ensureDirectoryExists() {
//         if (!fs.existsSync(this.gettermHome)) {
//             fs.mkdirSync(this.gettermHome);
//             Logger.info(`Created config directory: ${this.gettermHome}`);
//         }
//         // const notebookHome = path.join(this.gettermHome, 'notebook');
//         const notebookHome = this.getNotebookHome();
//         if (!fs.existsSync(notebookHome)) {
//             fs.mkdirSync(notebookHome);
//         }
//         const downloadHome = path.join(this.gettermHome, 'download');
//         if (!fs.existsSync(downloadHome)) {
//             fs.mkdirSync(downloadHome);
//         }

//     }

//     public static getInstance(): Config {
//         if (!Config.instance) {
//             const config = new Config();
//             config.gettermHome = config.getGettermHome();
//             config.configFilePath = path.join(config.gettermHome, ConfigFile);
    
//             config.ensureDirectoryExists(); // Create .getterm directory if it doesn’t exist
//             config.loadSettings();
//             config.registerFileSystemWatcher();
//             Config.instance = config;
//         }
//         return Config.instance;
//     }

//     public loadSettings(): void {
//         console.log("TEST: LOAD:", this.configFilePath);
//         if (fs.existsSync(this.configFilePath)) {
//             const data = fs.readFileSync(this.configFilePath, 'utf8');
//             this.settings = JSON.parse(data);
//             Logger.info(`load config ${this.configFilePath}`);
//         } else {
//             Logger.warn(`initialize config file ${this.configFilePath}`);
//             this.settings = {
//                 sqliteDbPath: SessionDb,
//                 notebookHome: NotebookHome,
//                 downloadHome: DownloadHome,
//                 terminalProfiles: [],
//                 version: ConfigVersion,
//             };
//             this.saveSettings();
//         }
//     }

//     public get<T extends keyof Settings>(key: T): Settings[T] {
//         return this.settings[key];
//     }

//     public set<T extends keyof Settings>(key: T, value: Settings[T]): void {
//         this.settings[key] = value;
//         this.saveSettings();
//     }

//     public getNotebookHome() : string {
//         const notebookHome = this.get('notebookHome') || NotebookHome;
//         return path.join(this.gettermHome, notebookHome);
//     }

//     public getDownloadHome() : string {
//         const downloadHome = this.get('downloadHome') || DownloadHome;
//         return path.join(this.gettermHome, downloadHome);
//     }

//     private saveSettings(): void {
//         const data = JSON.stringify(this.settings, null, 2);
//         // fs.writeFileSync(this.configFilePath, data, 'utf8');
//         try {
//             fs.writeFileSync(this.configFilePath, data, 'utf8');
//             vscode.window.showInformationMessage('設定が正常に保存されました。');
//         } catch (err) {
//             vscode.window.showErrorMessage(`設定の保存に失敗しました: ${(err as Error).message}`);
//         }
//     }

//     private registerFileSystemWatcher(): void {
//         const watcher = vscode.workspace.createFileSystemWatcher(this.configFilePath);
//         watcher.onDidChange(() => this.loadSettings());
//         watcher.onDidCreate(() => this.loadSettings());
//         watcher.onDidDelete(() => this.loadSettings());
//     }
// }
