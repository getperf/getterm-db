import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import { Session } from './model/sessions';
import { Command } from './model/commands';
import { Config } from './config';
import path from 'path';
import { Logger } from './logger';
import { Note } from './model/notes';
import { Cell } from './model/cells';
import { Util } from './util';
import { rejects } from 'assert';
import { WorkspaceManager } from './workspace_manager';
import { ConfigManager } from './config_manager';

export async function  initializeDatabase() : Promise<Database> {
    if (!WorkspaceManager.checkWorkspaceOpened()) {
        vscode.window.showErrorMessage('ワークスペースが開いていません');
        return Promise.reject(new Error('Workspace not opened.'));
    }
    const config = Config.getInstance();
    const gettermHome = config.getGettermHome();
    console.log("GettermHome: ", gettermHome);
    // const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
    const sqliteDbPath = config.get('sqliteDbPath') as string;
    // const sqliteDbAbsolutePath = path.join(workspaceRoot, sqliteDbPath);
    const sqliteDbAbsolutePath = path.join(gettermHome, sqliteDbPath);
    const db = new Database(sqliteDbAbsolutePath);
    await db.initialize();
    return db;
}

export class Database {
    private db: sqlite3.Database | null = null;
    sqliteDbPath: string | undefined;

    constructor(sqliteDbPath: string | undefined) {
        this.sqliteDbPath = sqliteDbPath;
    }

    // データベースの初期化
    public async initialize(): Promise<void> {
        if (!this.sqliteDbPath) {
            this.sqliteDbPath = ConfigManager.sqliteDbPath;
        }
        return new Promise((resolve, reject) => {
            try {
                console.log(`initialize database: ${this.sqliteDbPath}`);
                if (!this.sqliteDbPath) {
                    return reject(new Error('sqliteDbPath not set'));
                }
                this.db = new sqlite3.Database(this.sqliteDbPath, (err) => {
                    // console.log("ERROR DEBUG : ", err);
                    if (err) {
                        return reject(new Error(`database initialize error ${this.sqliteDbPath} : ${err.message}`));
                    } else {
                        resolve();
                    }
                });
                this.db.serialize(() => {
                    this.db!.run(`
                        CREATE TABLE IF NOT EXISTS sessions (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            profile_name TEXT,
                            description TEXT,
                            execute_path TEXT,
                            execute_args TEXT,
                            remote_type TEXT,
                            remote_host TEXT,
                            remote_user TEXT,
                            start DATETIME,
                            end DATETIME
                        )
                    `, (err) => {
                        if (err) {
                            throw new Error(`sessions table create error: ${err.message}`);
                        } else {
                            Logger.info(`sessions table created`);
                        }
                    });
        
                    this.db!.run(`
                        CREATE TABLE IF NOT EXISTS commands (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            session_id INTEGER,
                            command TEXT,
                            output TEXT,
                            cwd TEXT,
                            exit_code INTEGER,
                            file_operation_mode TEXT 
                                CHECK(file_operation_mode IN ('downloaded', 'failed', 'canceled')) 
                                NOT NULL DEFAULT 'canceled',
                            command_access_file TEXT,
                            download_file TEXT,
                            start DATETIME,
                            end DATETIME,
                            FOREIGN KEY(session_id) REFERENCES sessions(id)
                        )
                    `, (err) => {
                        if (err) {
                            throw new Error(`commands table create error: ${err.message}`);
                        } else {
                            Logger.info(`commands table created`);
                        }
                    });
                    this.db!.run(`
                        CREATE TABLE IF NOT EXISTS notes (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            title TEXT NOT NULL,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `, (err) => {
                        if (err) {
                            throw new Error(`notes table create error: ${err.message}`);
                        } else {
                            Logger.info(`notes table created`);
                        }
                    });

                    this.db!.run(`
                        CREATE TABLE IF NOT EXISTS cells (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            notebook_id INTEGER NOT NULL,
                            session_id INTEGER,
                            command_id INTEGER,
                            content TEXT NOT NULL,
                            type TEXT CHECK(type IN ('code', 'markdown')),
                            position INTEGER,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (notebook_id) REFERENCES notes(id) ON DELETE CASCADE,
                            FOREIGN KEY (session_id) REFERENCES sessions(id),
                            FOREIGN KEY (command_id) REFERENCES commands(id)
                        )
                    `, (err) => {
                        if (err) {
                            throw new Error(`notes table create error: ${err.message}`);
                        } else {
                            Logger.info(`notes table created`);
                        }
                    });

                });
                Session.setup(this.db);
                Command.setup(this.db);
                Note.setup(this.db);
                Cell.setup(this.db);
            } catch (error) {
                reject(error);
            }

            Logger.info(`initialize database : ${this.sqliteDbPath}`);
        });
    }

    // データベースインスタンスの取得
    public getDBInstance(): sqlite3.Database | null {
        if (!this.db) {
            throw new Error('database not initialized');
        }
        return this.db;
    }

    // クローズ処理
    public close(): void {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    throw new Error(`database close error : ${err.message}`);
                } else {
                    console.log('database closed');
                }
            });
        }
    }
}
