import sqlite3 from "sqlite3";
import { Session } from "../../model/sessions";
import { Command } from "../../model/commands";
import { Note } from "../../model/notes";
import { Cell } from "../../model/cells";

export function initializeTestDB(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    console.log("INIT TEST DB : Start");
    const db = new sqlite3.Database(":memory:", (err) => {
      if (err) {
        return reject(err);
      }
      db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_name TEXT,
            execute_path TEXT,
            execute_args TEXT,
            remote_host TEXT,
            remote_user TEXT,
            start DATE,
            end DATE
            )`);
        db.run(`
            CREATE TABLE IF NOT EXISTS commands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            command TEXT,
            output TEXT,
            cwd TEXT,
            exit_code INTEGER,
            start DATE,
            end DATE,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
            )`);
        db.run(`
            CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        db.run(
          `
            CREATE TABLE IF NOT EXISTS cells (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            notebook_id INTEGER NOT NULL,
            session_id INTEGER,
            command_id INTEGER,
            content TEXT NOT NULL,
            type TEXT CHECK(type IN ('code', 'markdown')),
            position INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (notebook_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (session_id) REFERENCES sessions(id),
            FOREIGN KEY (command_id) REFERENCES commands(id)
            )`,
          (err) => {
            if (err) {
              return reject(err);
            }
          }
        );
      });
    });
    // Set up the models with the database instance
    Session.setup(db);
    Command.setup(db);
    Note.setup(db);
    Cell.setup(db);
    console.log("INIT TEST DB : End");
    resolve(db);
  });
}
