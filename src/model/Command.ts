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
    private static dbHelper: DatabaseHelper;

    static setup(database: sqlite3.Database) {
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
    }

    static async createEmptyRow(session_id: number): Promise<number> {
        const query = `
            INSERT INTO commands (session_id, command, output, cwd, exit_code, start) 
            VALUES (?, "", "", "", 0, strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))
        `;
        return this.dbHelper.runQuery(query, [session_id]).then(() =>
            this.dbHelper.lastInsertRowId()
        );
    }

    static async getById(id: number): Promise<any> {
        const query = `SELECT * FROM commands WHERE id = ?`;
        return this.dbHelper.getQuery<CommandRow>(query, [id]);
    }

    static async getAllBySessionId(session_id: number): Promise<any[]> {
        const query = `SELECT * FROM commands WHERE session_id = ?`;
        return this.dbHelper.allQuery<CommandRow>(query, [session_id]);
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
    }

    static async updateEnd(id: number, date: Date): Promise<void> {
        const query = `UPDATE commands SET end = ? WHERE id = ?`;
        const formattedDateTime = Util.formatDateWithMilliseconds(date);
        return this.dbHelper.runQuery(query, [formattedDateTime, id]);
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
    }

    static async delete(id: number): Promise<void> {
        const query = `DELETE FROM commands WHERE id = ?`;
        return this.dbHelper.runQuery(query, [id]);
    }

    static async deleteAllBySessionId(session_id: number): Promise<void> {
        const query = `DELETE FROM commands WHERE session_id = ?`;
        return this.dbHelper.runQuery(query, [session_id]);
    }
}
