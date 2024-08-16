import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
// import * as path from 'path';
// import { Config } from './config';

export class Database {
    private db: sqlite3.Database | null = null;
        
    constructor(public sqliteDbPath: string) {}

    // データベースの初期化
    public async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.db = new sqlite3.Database(this.sqliteDbPath, (err) => {
                    if (err) {
                        return reject(new Error(`データベースの作成に失敗しました: ${err.message}`));
                    } else {
                        console.log(`データベースが作成されました: ${this.sqliteDbPath}`);
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
                            start DATE,
                            end DATE
                        )
                    `, (err) => {
                        if (err) {
                            throw new Error(`sessionsテーブルの作成に失敗しました: ${err.message}`);
                        } else {
                            console.log('sessionsテーブルが作成されました。');
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
                            start DATE,
                            end DATE,
                            FOREIGN KEY(session_id) REFERENCES sessions(id)
                        )
                    `, (err) => {
                        if (err) {
                            throw new Error(`commandsテーブルの作成に失敗しました: ${err.message}`);
                        } else {
                            console.log('commandsテーブルが作成されました。');
                        }
                    });
                });
            } catch (error) {
                reject(error);
            }
            console.log(`データベースが初期化されました: ${this.sqliteDbPath}`);
        });
    }

    // データベースインスタンスの取得
    public getDBInstance(): sqlite3.Database | null {
        if (!this.db) {
            throw new Error('データベースが初期化されていません。');
        }
        return this.db;
    }

    // クローズ処理
    public close(): void {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    throw new Error(`データベースのクローズに失敗しました: ${err.message}`);
                } else {
                    console.log('データベース接続が閉じられました。');
                }
            });
        }
    }
}
