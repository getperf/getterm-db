import * as sqlite3 from "sqlite3";
import { Util } from "../Util";
import { DatabaseHelper } from "../DatabaseHelper";

export interface CommandRow {
    id: number;
    session_id: number;
    command: string;
    output: string;
    cwd: string;
    exit_code: number;
    start: string;
    end: string | null;
    file_operation_mode: string | null;
    command_access_file: string | null;
    download_file: string | null;
}

export class Command {
    // private static db: sqlite3.Database;
    private static dbHelper: DatabaseHelper;

    static setup(database: sqlite3.Database) {
        // Command.db = database;
        this.dbHelper = new DatabaseHelper(database);
    }

    static async create(
        session_id: number,
        command: string,
        output: string,
        cwd: string,
        exit_code: number,
    ): Promise<number> {
        const query = `
            INSERT INTO commands (session_id, command, output, cwd, exit_code, start) 
            VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))
        `;
        return this.dbHelper.runQuery(query, [
            session_id,
            command,
            output,
            cwd,
            exit_code,
        ]).then(() => this.dbHelper.lastInsertRowId());
        // return new Promise((resolve, reject) => {
        //     const query = `INSERT INTO commands (session_id, command, output, cwd, exit_code, start) VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))`;
        //     Command.db.run(
        //         query,
        //         [session_id, command, output, cwd, exit_code],
        //         function (err) {
        //             if (err) {
        //                 reject(err);
        //             }
        //             resolve(this.lastID); // Get the last inserted ID
        //         },
        //     );
        // });
    }

    static async createEmptyRow(session_id: number): Promise<number> {
        const query = `
            INSERT INTO commands (session_id, command, output, cwd, exit_code, start) 
            VALUES (?, "", "", "", 0, strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))
        `;
        return this.dbHelper.runQuery(query, [session_id]).then(() =>
            this.dbHelper.lastInsertRowId()
        );
        // return new Promise((resolve, reject) => {
        //     const query = `INSERT INTO commands (session_id, command, output, cwd, exit_code, start) VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))`;
        //     Command.db.run(query, [session_id, "", "", "", 0], function (err) {
        //         if (err) {
        //             reject(err);
        //         }
        //         resolve(this.lastID); // Get the last inserted ID
        //     });
        // });
    }

    static async getById(id: number): Promise<any> {
        const query = `SELECT * FROM commands WHERE id = ?`;
        return this.dbHelper.getQuery<CommandRow>(query, [id]);
        // return new Promise((resolve, reject) => {
        //     const query = `SELECT * FROM commands WHERE id = ?`;
        //     Command.db.get(query, [id], (err, row) => {
        //         if (err) {
        //             reject(err);
        //         }
        //         resolve(row);
        //     });
        // });
    }

    static async getAllBySessionId(session_id: number): Promise<any[]> {
        const query = `SELECT * FROM commands WHERE session_id = ?`;
        return this.dbHelper.allQuery<CommandRow>(query, [session_id]);
        // return new Promise((resolve, reject) => {
        //     const query = `SELECT * FROM commands WHERE session_id = ?`;
        //     Command.db.all(query, [session_id], (err, rows) => {
        //         if (err) {
        //             reject(err);
        //         }
        //         resolve(rows);
        //     });
        // });
    }

    static async update(
        id: number,
        command: string,
        output: string,
        cwd: string,
        exit_code: number,
    ): Promise<void> {
        const query = `
            UPDATE commands 
            SET command = ?, output = ?, cwd = ?, exit_code = ?, 
                end = strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime') 
            WHERE id = ?
        `;
        return this.dbHelper.runQuery(query, [
            command,
            output,
            cwd,
            exit_code,
            id,
        ]);
        // return new Promise((resolve, reject) => {
        //     const query = `UPDATE commands SET command = ?, output = ?, cwd = ?, exit_code = ?, end = strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime') WHERE id = ?`;
        //     Command.db.run(
        //         query,
        //         [command, output, cwd, exit_code, id],
        //         (err) => {
        //             if (err) {
        //                 reject(err);
        //             }
        //             resolve();
        //         },
        //     );
        // });
    }

    static async updatedWithoutTimestamp(
        id: number,
        command: string,
        output: string,
        cwd: string,
        exit_code: number,
    ): Promise<void> {
        const query = `
            UPDATE commands 
            SET command = ?, output = ?, cwd = ?, exit_code = ? 
            WHERE id = ?
        `;
        return this.dbHelper.runQuery(query, [
            command,
            output,
            cwd,
            exit_code,
            id,
        ]);
        // return new Promise((resolve, reject) => {
        //     const query = `UPDATE commands SET command = ?, output = ?, cwd = ?, exit_code = ? WHERE id = ?`;
        //     Command.db.run(
        //         query,
        //         [command, output, cwd, exit_code, id],
        //         (err) => {
        //             if (err) {
        //                 reject(err);
        //             }
        //             resolve();
        //         },
        //     );
        // });
    }

    static async updateConceredFileOperation(
        id: number,
        updateMode: "downloaded" | "failed" | "canceled",
        commandAccessFile: string,
        downloadFile: string | null,
    ): Promise<void> {
        const query = `
            UPDATE commands 
            SET file_operation_mode = ?, command_access_file = ?, download_file = ? 
            WHERE id = ?
        `;
        return this.dbHelper.runQuery(query, [
            updateMode,
            commandAccessFile,
            downloadFile,
            id,
        ]);
        // return new Promise((resolve, reject) => {
        //     const sql = `
        //         UPDATE commands 
        //         SET file_operation_mode = ?, 
        //             command_access_file = ?, 
        //             download_file = ?
        //         WHERE id = ?
        //     `;
        //     Command.db.run(
        //         sql,
        //         [updateMode, commandAccessFile, downloadFile, id],
        //         function (err) {
        //             if (err) {
        //                 reject(err);
        //             } else if (this.changes === 0) {
        //                 reject(new Error("No rows were updated"));
        //             } else {
        //                 resolve();
        //             }
        //         },
        //     );
        // });
    }

    // private static formatDateWithMilliseconds(date: Date): string {
    //     const padZero = (num: number) => num.toString().padStart(2, '0');
    //     const milliseconds = date.getMilliseconds().toString().padStart(3, '0'); // Milliseconds formatted to 3 digits

    //     return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ` +
    //            `${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}.${milliseconds}`;
    // }

    static async updateEnd(id: number, date: Date): Promise<void> {
        const query = `UPDATE commands SET end = ? WHERE id = ?`;
        const formattedDateTime = Util.formatDateWithMilliseconds(date);
        return this.dbHelper.runQuery(query, [formattedDateTime, id]);
        // return new Promise((resolve, reject) => {
        //     const query = `UPDATE commands SET end = ? WHERE id = ?`;
        //     const formattedDateTime = Util.formatDateWithMilliseconds(date); // Format
        //     Command.db.run(query, [formattedDateTime, id], (err) => {
        //         if (err) {
        //             reject(err);
        //         }
        //         resolve();
        //     });
        // });
    }

    static async updateTimestamp(commandId: number, startTime: Date, endTime: Date): Promise<void> {
        const query = `
            UPDATE commands
            SET start = ?, end = ?
            WHERE id = ?
        `;
        return this.dbHelper.runQuery(query, [
            Util.formatDateWithMilliseconds(startTime), 
            Util.formatDateWithMilliseconds(endTime), 
            commandId
        ]);
        // return new Promise((resolve, reject) => {
        //     this.db.run(query, [startTime.toISOString(), endTime.toISOString(), commandId], (err) => {
        //         if (err) {
        //             return reject(err);
        //         }
        //         resolve();
        //     });
        // });
    }

    static async delete(id: number): Promise<void> {
        const query = `DELETE FROM commands WHERE id = ?`;
        return this.dbHelper.runQuery(query, [id]);
        // return new Promise((resolve, reject) => {
        //     const query = `DELETE FROM commands WHERE id = ?`;
        //     Command.db.run(query, [id], (err) => {
        //         if (err) {
        //             reject(err);
        //         }
        //         resolve();
        //     });
        // });
    }

    static async deleteAllBySessionId(session_id: number): Promise<void> {
        const query = `DELETE FROM commands WHERE session_id = ?`;
        return this.dbHelper.runQuery(query, [session_id]);
        // return new Promise((resolve, reject) => {
        //     const query = `DELETE FROM commands WHERE session_id = ?`;
        //     Command.db.run(query, [session_id], (err) => {
        //         if (err) {
        //             reject(err);
        //         }
        //         resolve();
        //     });
        // });
    }
}
