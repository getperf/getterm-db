import sqlite3 from "sqlite3";
import { Session } from "../../model/sessions";
import { Command } from "../../model/commands";
import { Note } from "../../model/notes";
import { Cell } from "../../model/cells";

export function initializeTestDB(done: Mocha.Done): sqlite3.Database {
    const db = new sqlite3.Database(':memory:', (err) => {
      if (err) {return done(err);}

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
              file_update_mode TEXT 
                CHECK(file_update_mode IN ('updated', 'failed', 'no_update')) 
                NOT NULL DEFAULT 'no_update',
              update_file_path TEXT,
              download_file_path TEXT,
              exit_code INTEGER,
              start DATETIME,
              end DATETIME,
              FOREIGN KEY(session_id) REFERENCES sessions(id)
          )`);
        db.run(`
          CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
        db.run(`
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
          )`, (err) => {
            if (err) {
              done(err); // Fail the test if there's an error creating tables
            } else {
              done(); // Signal that the test setup is complete
            }
          });
        });
    });

  // Set up the models with the database instance
  Session.setup(db);
  Command.setup(db);
  Note.setup(db);
  Cell.setup(db);
  return db;
}

