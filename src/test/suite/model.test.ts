import * as sqlite3 from 'sqlite3';
import * as assert from 'assert';
import { Session } from '../../model/sessions';
import { Command } from '../../model/commands';

suite('Database Models', function () {
  let db: sqlite3.Database;

  // Setup in-memory database before tests
  suiteSetup(function (done) {
    db = new sqlite3.Database(':memory:', (err) => {
      if (err) {return done(err);}

      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_name TEXT,
            execute_path TEXT,
            execute_args TEXT,
            remote_host TEXT,
            user TEXT,
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
          )`, done);
      });
    });
    // Set up the models with the database instance
    Session.setup(db);
    Command.setup(db);

  });

  // Clean up after tests
  suiteTeardown(function (done) {
    db.close(done);
  });

  test('should create, retrieve, update, and delete a session', async function () {
    const sessionId = await Session.create('test_profile', '/path/to/exe', ['arg1'], 'host', 'user');
    const session = await Session.getById(sessionId);

    assert.strictEqual(session.profile_name, 'test_profile');
    assert.strictEqual(session.execute_path, '/path/to/exe');

    await Session.update(sessionId, 'new_profile', '/new/path', ['arg2'], 'new_host', 'new_user');
    const updatedSession = await Session.getById(sessionId);

    assert.strictEqual(updatedSession.profile_name, 'new_profile');

    await Session.delete(sessionId);
    const deletedSession = await Session.getById(sessionId);

    assert.strictEqual(deletedSession, undefined);
  });

  test('should create, retrieve, update, and delete a command', async function () {
    const sessionId = await Session.create('test_profile', '/path/to/exe', ['arg1'], 'host', 'user');
    const commandId = await Command.create(sessionId, 'ls -al', 'output', '/cwd', 0);
    const command = await Command.getById(commandId);

    assert.strictEqual(command.command, 'ls -al');
    assert.strictEqual(command.output, 'output');

    await Command.update(commandId, 'updated command', 'new output', '/new/cwd', 1);
    const updatedCommand = await Command.getById(commandId);

    assert.strictEqual(updatedCommand.command, 'updated command');

    await Command.delete(commandId);
    const deletedCommand = await Command.getById(commandId);

    assert.strictEqual(deletedCommand, undefined);
  });
});
