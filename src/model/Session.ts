import * as sqlite3 from "sqlite3";
import { Util } from "../Util";
import * as vscode from "vscode";

export interface SessionRow {
    id: number;
    profile_name: string;
    description: string;
    execute_path: string;
    execute_args: string;
    remote_type: string;
    remote_host: string;
    remote_user: string;
    start: string; // SQLiteの`strftime`で生成される日時
    end?: string; // セッション終了時刻（オプショナル）
}

export class Session {
    private static db: sqlite3.Database;

    // constructor(db: sqlite3.Database) {
    //     Session.db = db;
    // }

    static setup(database: sqlite3.Database) {
        Session.db = database;
    }

    static async create(
        profile_name: string,
        execute_path: string,
        execute_args: string[],
        remote_host: string,
        user: string,
    ): Promise<number> {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO sessions (profile_name, execute_path, execute_args, remote_host, remote_user, start) VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))`;
            Session.db.run(
                query,
                [
                    profile_name,
                    execute_path,
                    JSON.stringify(execute_args),
                    remote_host,
                    user,
                ],
                function (err) {
                    if (err) {
                        reject(err);
                    }
                    resolve(this.lastID); // Get the last inserted ID
                },
            );
        });
    }

    static async createByTerminalOptions(opt: vscode.TerminalOptions): Promise<number> {
        if (!opt.name || !opt.shellPath || !opt.shellArgs) {
            return Promise.reject(new Error("Terminal options are invalid"));
        }
        const shellArgs = Array.isArray(opt.shellArgs) ? opt.shellArgs : [opt.shellArgs];
        return await Session.create(opt.name, opt.shellPath, shellArgs, "", "");
    }

    static async getById(id: number): Promise<SessionRow | null> {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM sessions WHERE id = ?`;
            Session.db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err);
                }
                resolve(row as SessionRow | null);
            });
        });
    }
    // static async getById(id: number): Promise<any> {
    //     return new Promise((resolve, reject) => {
    //         const query = `SELECT * FROM sessions WHERE id = ?`;
    //         Session.db.get(query, [id], (err, row) => {
    //             if (err) {reject(err);}
    //             resolve(row);
    //         });
    //     });
    // }

    static async update(
        id: number,
        profile_name: string,
        execute_path: string,
        execute_args: string[],
        remote_host: string,
        user: string,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `UPDATE sessions SET profile_name = ?, execute_path = ?, execute_args = ?, remote_host = ?, remote_user = ? WHERE id = ?`;
            Session.db.run(
                query,
                [
                    profile_name,
                    execute_path,
                    JSON.stringify(execute_args),
                    remote_host,
                    user,
                    id,
                ],
                (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                },
            );
        });
    }

    static async updateEnd(id: number, date: Date): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `UPDATE commands SET end = ? WHERE id = ?`;
            const formattedDateTime = Util.formatDateWithMilliseconds(date); // Format
            Session.db.run(query, [formattedDateTime, id], (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    static async delete(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM sessions WHERE id = ?`;
            Session.db.run(query, [id], (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }
}
