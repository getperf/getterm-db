import * as sqlite3 from 'sqlite3';
import { Util } from '../util';

export class Session {
    private static db: sqlite3.Database;

    // constructor(db: sqlite3.Database) {
    //     Session.db = db;
    // }

    static setup(database: sqlite3.Database) {
      Session.db = database;
    }

    static async create(profile_name: string, execute_path: string, execute_args: string[], remote_host: string, user: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO sessions (profile_name, execute_path, execute_args, remote_host, remote_user, start) VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))`;
            Session.db.run(query, [profile_name, execute_path, JSON.stringify(execute_args), remote_host, user], function (err) {
                if (err) {reject(err);}
                resolve(this.lastID); // Get the last inserted ID
            });
        });
    }

    static async getById(id: number): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM sessions WHERE id = ?`;
            Session.db.get(query, [id], (err, row) => {
                if (err) {reject(err);}
                resolve(row);
            });
        });
    }

    static async update(id: number, profile_name: string, execute_path: string, execute_args: string[], remote_host: string, user: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `UPDATE sessions SET profile_name = ?, execute_path = ?, execute_args = ?, remote_host = ?, remote_user = ? WHERE id = ?`;
            Session.db.run(query, [profile_name, execute_path, JSON.stringify(execute_args), remote_host, user, id], (err) => {
                if (err) {reject(err);}
                resolve();
            });
        });
    }

    static async updateEnd(id: number, date: Date): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `UPDATE commands SET end = ? WHERE id = ?`;
            const formattedDateTime = Util.formatDateWithMilliseconds(date); // Format 
            Session.db.run(query, [formattedDateTime, id], (err) => {
                if (err) {reject(err);}
                resolve();
            });
        });
    }

    static async delete(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM sessions WHERE id = ?`;
            Session.db.run(query, [id], (err) => {
                if (err) {reject(err);}
                resolve();
            });
        });
    }
}
