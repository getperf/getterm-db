import * as sqlite3 from 'sqlite3';
import { Util } from '../util';

export class Command {
    private static db: sqlite3.Database;

    // constructor(db: sqlite3.Database) {
    //     Command.db = db;
    // }

    static setup(database: sqlite3.Database) {
      Command.db = database;
    }

    static async create(session_id: number, command: string, output: string, cwd: string, exit_code: number): Promise<number> {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO commands (session_id, command, output, cwd, exit_code, start) VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))`;
            Command.db.run(query, [session_id, command, output, cwd, exit_code], function (err) {
                if (err) {reject(err);}
                resolve(this.lastID); // Get the last inserted ID
            });
        });
    }

    static async createEmptyRow(session_id: number): Promise<number> {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO commands (session_id, command, output, cwd, exit_code, start) VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))`;
            Command.db.run(query, [session_id, '', '', '', 0], function (err) {
                if (err) {reject(err);}
                resolve(this.lastID); // Get the last inserted ID
            });
        });
    }

    static async getById(id: number): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM commands WHERE id = ?`;
            Command.db.get(query, [id], (err, row) => {
                if (err) {reject(err);}
                resolve(row);
            });
        });
    }

    static async getAllBySessionId(session_id: number): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM commands WHERE session_id = ?`;
            Command.db.all(query, [session_id], (err, rows) => {
                if (err) {reject(err);}
                resolve(rows);
            });
        });
    }

    static async update(id: number, command: string, output: string, cwd: string, exit_code: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `UPDATE commands SET command = ?, output = ?, cwd = ?, exit_code = ?, end = strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime') WHERE id = ?`;
            Command.db.run(query, [command, output, cwd, exit_code, id], (err) => {
                if (err) {reject(err);}
                resolve();
            });
        });
    }

    static async updatedWithoutTimestamp(id: number, command: string, output: string, cwd: string, exit_code: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `UPDATE commands SET command = ?, output = ?, cwd = ?, exit_code = ? WHERE id = ?`;
            Command.db.run(query, [command, output, cwd, exit_code, id], (err) => {
                if (err) {reject(err);}
                resolve();
            });
        });
    }

    static async updateConceredFileOperation(
        id: number,
        updateMode: 'downloaded' | 'failed' | 'canceled',
        commandAccessFile: string, 
        downloadFile: string | null
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE commands 
                SET file_operation_mode = ?, 
                    command_access_file = ?, 
                    download_file = ?
                WHERE id = ?
            `;
            Command.db.run(
                sql,
                [updateMode, commandAccessFile, downloadFile, id],
                function (err) {
                    if (err) {
                        reject(err);
                    } else if (this.changes === 0) {
                        reject(new Error('No rows were updated'));
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    // private static formatDateWithMilliseconds(date: Date): string {
    //     const padZero = (num: number) => num.toString().padStart(2, '0');
    //     const milliseconds = date.getMilliseconds().toString().padStart(3, '0'); // Milliseconds formatted to 3 digits
    
    //     return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ` +
    //            `${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}.${milliseconds}`;
    // }

    static async updateEnd(id: number, date: Date): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `UPDATE commands SET end = ? WHERE id = ?`;
            const formattedDateTime = Util.formatDateWithMilliseconds(date); // Format 
            Command.db.run(query, [formattedDateTime, id], (err) => {
                if (err) {reject(err);}
                resolve();
            });
        });
    }

    static async delete(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM commands WHERE id = ?`;
            Command.db.run(query, [id], (err) => {
                if (err) {reject(err);}
                resolve();
            });
        });
    }

    static async deleteAllBySessionId(session_id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM commands WHERE session_id = ?`;
            Command.db.run(query, [session_id], (err) => {
                if (err) {reject(err);}
                resolve();
            });
        });
    }
}
