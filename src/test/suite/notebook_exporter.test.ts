import * as sqlite3 from "sqlite3";
import * as assert from "assert";
import { Session } from "../../model/sessions";
import { Command } from "../../model/commands";
import { Note } from "../../model/notes";
import { Cell } from "../../model/cells";
import { initializeTestDB } from "./initialize_test_db";

suite("TerminalNotebookExporter Tests", () => {
  let db: sqlite3.Database;

  suiteSetup(async function (done) {
    // suiteSetup(async() => {
    // db = await initializeTestDB();
    db = new sqlite3.Database(":memory:", (err) => {
      if (err) {
        return done(err);
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
          done
        );
      });
    });
    // Set up the models with the database instance
    Session.setup(db);
    Command.setup(db);
    Note.setup(db);
    Cell.setup(db);
  });

  // Clean up after tests
  suiteTeardown(function (done) {
    db.close(done);
  });

  test("should save notebook correctly when no existing note", async function () {
    const sessionId = await Session.create(
      "test_profile",
      "/path/to/exe",
      ["arg1"],
      "host",
      "user"
    );
    const session = await Session.getById(sessionId);

    assert.strictEqual(session.profile_name, "test_profile");
    assert.strictEqual(session.execute_path, "/path/to/exe");

    await Session.update(
      sessionId,
      "new_profile",
      "/new/path",
      ["arg2"],
      "new_host",
      "new_user"
    );
    const updatedSession = await Session.getById(sessionId);

    assert.strictEqual(updatedSession.profile_name, "new_profile");

    await Session.delete(sessionId);
    const deletedSession = await Session.getById(sessionId);

    assert.strictEqual(deletedSession, undefined);
  });
});
