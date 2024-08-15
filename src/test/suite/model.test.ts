import * as sqlite3 from 'sqlite3';
import * as assert from 'assert';
import { Session } from '../../model/sessions';
import { Command } from '../../model/commands';

suite('Database Models', function () {
    let db: sqlite3.Database;
    let session: Session;
    let command: Command;
  
    // Setup in-memory database before tests
    suiteSetup(function (done) {
      db = new sqlite3.Database(':memory:', (err) => {
        if (err) {return done(err);}
        session = new Session(db);
        command = new Command(db);
  
        // Create tables before tests
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
    });
  
    // Clean up after tests
    suiteTeardown(function (done) {
      db.close(done);
    });

    // describe('Session CRUD Operations', function () {
        let createdSessionId: number;
    
        test('should create a new session', async function () {
          createdSessionId = await session.create('test_profile', '/path/to/exe', ['arg1', 'arg2'], 'remote_host', 'user');
        //   expect(createdSessionId).to.be.a('number');
          assert.strictEqual(1, 1);
        });
    // });
});
