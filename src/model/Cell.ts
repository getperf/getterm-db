import * as sqlite3 from 'sqlite3';

interface CellRow {
    id: number;
    notebook_id: number;
    session_id: number | null;
    command_id: number | null;
    content: string;
    type: 'code' | 'markdown';
    position: number;
}

export class Cell {
    private static db: sqlite3.Database;
    id: number;
    notebookId: number;
    sessionId: number | null;
    commandId: number | null;
    content: string;
    type: 'code' | 'markdown';
    position: number;

    constructor(
        id: number,
        notebookId: number,
        sessionId: number | null,
        commandId: number | null,
        content: string,
        type: 'code' | 'markdown',
        position: number
    ) {
        this.id = id;
        this.notebookId = notebookId;
        this.sessionId = sessionId;
        this.commandId = commandId;
        this.content = content;
        this.type = type;
        this.position = position;
    }

    static setup(database: sqlite3.Database) {
      Cell.db = database;
    }

    static async create(
        notebookId: number,
        sessionId: number | null,
        commandId: number | null,
        content: string,
        type: 'code' | 'markdown'
    ): Promise<Cell> {
        return new Promise((resolve, reject) => {
            // Get the max position to calculate the new position
            Cell.db.get(
                `SELECT MAX(position) as maxPosition FROM cells WHERE notebook_id = ?`,
                [notebookId],
                (err, row : any) => {
                    if (err) {return reject(err);}

                    const position = row.maxPosition !== null ? row.maxPosition + 1 : 1;
                    Cell.db.run(
                        `INSERT INTO cells (notebook_id, session_id, command_id, content, type, position) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [notebookId, sessionId, commandId, content, type, position],
                        function (err) {
                            if (err) {return reject(err);}
                            resolve(new Cell(this.lastID, notebookId, sessionId, commandId, content, type, position));
                        }
                    );
                }
            );
        });
    }

    static async getByNotebookId(notebookId: number): Promise<Cell[]> {
        return new Promise((resolve, reject) => {
            Cell.db.all(
                `SELECT * FROM cells WHERE notebook_id = ? ORDER BY position`,
                [notebookId],
                (err, rows: CellRow[]) => {
                    if (err) {return reject(err);}
                    resolve(
                        rows.map(
                            (row) =>
                                new Cell(
                                    row.id,
                                    row.notebook_id,
                                    row.session_id,
                                    row.command_id,
                                    row.content,
                                    row.type,
                                    row.position
                                )
                        )
                    );
                }
            );
        });
    }

    static async update(
        id: number,
        content: string,
        type: 'code' | 'markdown',
        position: number
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            Cell.db.run(
                `UPDATE cells SET content = ?, type = ?, position = ? WHERE id = ?`,
                [content, type, position, id],
                (err) => {
                    if (err) {return reject(err);}
                    resolve();
                }
            );
        });
    }

    static async delete(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            Cell.db.run(
                `DELETE FROM cells WHERE id = ?`,
                [id],
                (err) => {
                    if (err) {return reject(err);}
                    resolve();
                }
            );
        });
    }

    static async deleteByNotebookId(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            Cell.db.run(
                `DELETE FROM cells WHERE notebook_id = ?`,
                [id],
                (err) => {
                    if (err) {return reject(err);}
                    resolve();
                }
            );
        });
    }

}