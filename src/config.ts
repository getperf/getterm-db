import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';

export const SessionDb = 'session.db';
export const ConfigFile = '.getterm.json';
export const ConfigVersion = '1.0';

interface Settings {
    sqliteDbPath?: string;
    terminalProfiles?: string[];
    version?: string;
}

export class Config {
    private static instance: Config;
    private settings: Settings = {};
    private configFilePath: string;

    private constructor() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
        this.configFilePath = path.join(workspaceRoot, ConfigFile);
        this.loadSettings();
        this.registerFileSystemWatcher();
    }

    public static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

    public loadSettings(): void {
        console.log("TEST: LOAD:", this.configFilePath);
        if (fs.existsSync(this.configFilePath)) {
            const data = fs.readFileSync(this.configFilePath, 'utf8');
            this.settings = JSON.parse(data);
            Logger.info(`load config ${this.configFilePath}`);
        } else {
            Logger.warn(`initialize config file ${this.configFilePath}`);
            this.settings = {
                sqliteDbPath: SessionDb,
                terminalProfiles: [],
                version: ConfigVersion,
            };
            this.saveSettings();
        }
    }

    public get<T extends keyof Settings>(key: T): Settings[T] {
        return this.settings[key];
    }

    public set<T extends keyof Settings>(key: T, value: Settings[T]): void {
        this.settings[key] = value;
        this.saveSettings();
    }

    private saveSettings(): void {
        const data = JSON.stringify(this.settings, null, 2);
        // fs.writeFileSync(this.configFilePath, data, 'utf8');
        try {
            fs.writeFileSync(this.configFilePath, data, 'utf8');
            vscode.window.showInformationMessage('設定が正常に保存されました。');
        } catch (err) {
            vscode.window.showErrorMessage(`設定の保存に失敗しました: ${(err as Error).message}`);
        }
    }

    private registerFileSystemWatcher(): void {
        const watcher = vscode.workspace.createFileSystemWatcher(this.configFilePath);
        watcher.onDidChange(() => this.loadSettings());
        watcher.onDidCreate(() => this.loadSettings());
        watcher.onDidDelete(() => this.loadSettings());
    }
}
