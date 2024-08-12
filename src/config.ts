import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface Settings {
    sqliteDbPath?: string;
    terminalProfiles?: string[];
    version?: string;
}

const Version = '1.0';
const ConfigFile = '.getterm.json';
const SessionDB = 'session.db';

export class Config {
    private static instance: Config;
    private settings: Settings = {};
    private configFilePath: string;
    private defaultDbPath: string;
    private defaultVersion: string = Version;

    private constructor() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
        this.configFilePath = path.join(workspaceRoot, ConfigFile);
        this.defaultDbPath = SessionDB;

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
        if (fs.existsSync(this.configFilePath)) {
            const data = fs.readFileSync(this.configFilePath, 'utf8');
            this.settings = JSON.parse(data);
        } else {
            this.settings = {}; // Initialize with default settings if the file does not exist
        }

        // Set default sqliteDbPath if it is not defined
        if (!this.settings.sqliteDbPath) {
            this.settings.sqliteDbPath = this.defaultDbPath;
        }

        // Set default version if it is not defined
        if (!this.settings.version) {
            this.settings.version = this.defaultVersion;
        }

        this.saveSettings();
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
        fs.writeFileSync(this.configFilePath, data, 'utf8');
    }

    private registerFileSystemWatcher(): void {
        const watcher = vscode.workspace.createFileSystemWatcher('.getterm.json');
        watcher.onDidChange(() => this.loadSettings());
        watcher.onDidCreate(() => this.loadSettings());
        watcher.onDidDelete(() => this.loadSettings());
    }
}
