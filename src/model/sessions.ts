import * as sqlite3 from 'sqlite3';

export class Session {
  constructor(private db: sqlite3.Database) {}

  create(profileName: string, executePath: string, args: string[], remoteHost: string, user: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO sessions (profile_name, execute_path, execute_args, remote_host, user, start) 
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `;
      this.db.run(query, [profileName, executePath, args.join(' '), remoteHost, user], function (err) {
        if (err) {return reject(err);}
        resolve(this.lastID); // Return the session ID
      });
    });
  }

  getById(sessionId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM sessions WHERE id = ?`;
      this.db.get(query, [sessionId], (err, row) => {
        if (err) {return reject(err);}
        resolve(row);
      });
    });
  }

  update(sessionId: number, profileName: string, executePath: string, args: string[], remoteHost: string, user: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE sessions 
        SET profile_name = ?, execute_path = ?, execute_args = ?, remote_host = ?, user = ?, end = datetime('now')
        WHERE id = ?
      `;
      this.db.run(query, [profileName, executePath, args.join(' '), remoteHost, user, sessionId], (err) => {
        if (err) {return reject(err);}
        resolve();
      });
    });
  }

  delete(sessionId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM sessions WHERE id = ?`;
      this.db.run(query, [sessionId], (err) => {
        if (err) {return reject(err);}
        resolve();
      });
    });
  }

  // Additional CRUD methods can be added here if needed.
}