import * as sqlite3 from 'sqlite3';

export class Command {
  constructor(private db: sqlite3.Database) {}

  create(sessionId: number, command: string, output: string, cwd: string, exitCode: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO commands (session_id, command, output, cwd, exit_code, start) 
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `;
      this.db.run(query, [sessionId, command, output, cwd, exitCode], function (err) {
        if (err) {return reject(err);}
        resolve(this.lastID); // Return the command ID
      });
    });
  }

  getById(commandId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM commands WHERE id = ?`;
      this.db.get(query, [commandId], (err, row) => {
        if (err) {return reject(err);}
        resolve(row);
      });
    });
  }

  getAllBySessionId(sessionId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM commands WHERE session_id = ?`;
      this.db.all(query, [sessionId], (err, rows) => {
        if (err) {return reject(err);}
        resolve(rows);
      });
    });
  }

  update(commandId: number, command: string, output: string, cwd: string, exitCode: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE commands 
        SET command = ?, output = ?, cwd = ?, exit_code = ?, end = datetime('now')
        WHERE id = ?
      `;
      this.db.run(query, [command, output, cwd, exitCode, commandId], (err) => {
        if (err) {return reject(err);}
        resolve();
      });
    });
  }

  delete(commandId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM commands WHERE id = ?`;
      this.db.run(query, [commandId], (err) => {
        if (err) {return reject(err);}
        resolve();
      });
    });
  }

  deleteAllBySessionId(sessionId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM commands WHERE session_id = ?`;
      this.db.run(query, [sessionId], (err) => {
        if (err) {return reject(err);}
        resolve();
      });
    });
  }
}
