import * as sqlite3 from 'sqlite3';

interface NoteRow {
    id: number;
    title: string;
}

type ReportRow = {
    position: number;
    type: string;
    profile_name: string,
    content: string,
    output: string,
    start: Date,
    end: Date,
    exit_code: number,
};

export class Note {
    private static db: sqlite3.Database;
    id: number;
    title: string;

    constructor(id: number, title: string) {
        this.id = id;
        this.title = title;
    }


    static setup(database: sqlite3.Database) {
      Note.db = database;
    }

    static async create(title: string): Promise<Note> {
        return new Promise((resolve, reject) => {
            Note.db.run(
                `INSERT INTO notes (title) VALUES (?)`,
                [title],
                function (err) {
                    if (err) {return reject(err);}
                    resolve(new Note(this.lastID, title));
                }
            );
        });
    }

    static async getById(id: number): Promise<Note | null> {
        return new Promise((resolve, reject) => {
            Note.db.get(
                `SELECT * FROM notes WHERE id = ?`,
                [id],
                (err, row : NoteRow) => {
                    if (err) {return reject(err);}
                    resolve(row ? new Note(row.id, row.title) : null);
                }
            );
        });
    }

    static async getByTitle(title: string): Promise<Note | null> {
        return new Promise((resolve, reject) => {
            Note.db.get(
                `SELECT * FROM notes WHERE title = ?`,
                [title],
                (err, row : NoteRow) => {
                    if (err) {return reject(err);}
                    resolve(row ? new Note(row.id, row.title) : null);
                }
            );
        });
    }

    static async update(id: number, title: string): Promise<void> {
        return new Promise((resolve, reject) => {
            Note.db.run(
                `UPDATE notes SET title = ? WHERE id = ?`,
                [title, id],
                (err) => {
                    if (err) {return reject(err);}
                    resolve();
                }
            );
        });
    }

    static async delete(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            Note.db.run(
                `DELETE FROM notes WHERE id = ?`,
                [id],
                (err) => {
                    if (err) {return reject(err);}
                    resolve();
                }
            );
        });
    }

    static async getAll(): Promise<Note[]> {
        return new Promise((resolve, reject) => {
            Note.db.all(
                `SELECT * FROM notes`,
                (err, rows: NoteRow[]) => {
                    if (err) {return reject(err);}
                    resolve(rows.map((row) => new Note(row.id, row.title)));
                }
            );
        });
    }

    static async reportQuery(id: number): Promise<ReportRow[]> {
        return new Promise((resolve, reject) => {
            Note.db.all(
                // `SELECT cel.position, cel.type, cel.content, 
                //     cmd.output, cmd.start, cmd.end, cmd.exit_code
                // FROM cells AS cel
                // LEFT JOIN commands AS cmd ON cmd.id = cel.command_id
                // WHERE notebook_id = ?`,
                `SELECT cel.position, cel.type, ses.profile_name, cel.content, 
                    cmd.output, cmd.start, cmd.end, cmd.exit_code
                FROM cells AS cel
                LEFT JOIN commands AS cmd ON cmd.id = cel.command_id
                LEFT JOIN sessions AS ses ON ses.id = cmd.session_id
                WHERE notebook_id = ?`,
                [id],
                (err, rows: ReportRow[]) => {
                    if (err) {return reject(err);}
                    resolve(rows);
                }
            );
        });
    }
}