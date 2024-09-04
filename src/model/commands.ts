import * as sqlite3 from 'sqlite3';

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

    static async updateEndTimestamp(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `UPDATE commands SET end = strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime') WHERE id = ?`;
            Command.db.run(query, [id], (err) => {
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
