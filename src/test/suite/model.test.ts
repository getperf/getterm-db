import * as sqlite3 from 'sqlite3';
import * as assert from 'assert';
import { Session } from '../../model/sessions';
import { Command } from '../../model/commands';
import { Note } from '../../model/notes';
import { Cell } from '../../model/cells';
import { initializeTestDB } from './initialize_test_db';

suite('Database Models', function () {
  let db: sqlite3.Database;

  // Setup in-memory database before tests
  suiteSetup(function (done) {
    db = initializeTestDB(done);
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

    await Command.updatedWithoutTimestamp(commandId, 'error command', 'error output', '/new/cwd', -1);
    const updatedEndCommand = await Command.getById(commandId);

    assert.strictEqual(updatedEndCommand.output, 'error output');

    await Command.delete(commandId);
    const deletedCommand = await Command.getById(commandId);

    assert.strictEqual(deletedCommand, undefined);
  });

  test('Get All Commands by Session ID and Delete All Commands by Session ID', async function () {
    // Create a session
    const sessionId = await Session.create('test_profile', '/path/to/exe', ['arg1'], 'remote_host', 'user');

    // Create multiple commands under the same session
    await Command.create(sessionId, 'command1', 'output1', '/cwd', 0);
    await Command.create(sessionId, 'command2', 'output2', '/cwd', 0);
    await Command.create(sessionId, 'command3', 'output3', '/cwd', 0);

    // Retrieve all commands by session ID
    const commands = await Command.getAllBySessionId(sessionId);
    assert.strictEqual(commands.length, 3, 'All commands were retrieved.');

    // Delete all commands by session ID
    await Command.deleteAllBySessionId(sessionId);
    const deletedCommands = await Command.getAllBySessionId(sessionId);
    assert.strictEqual(deletedCommands.length, 0, 'All commands were deleted.');
  });

  test('should create a new note', async () => {
    const title = 'Test Note';
    const note = await Note.create(title);
    assert.strictEqual(note.title, title);
    assert.ok(note.id);
  });

  test('should retrieve a note by ID', async () => {
    const title = 'Another Test Note';
    const createdNote = await Note.create(title);
    const retrievedNote = await Note.getById(createdNote.id);

    assert.ok(retrievedNote);
    assert.strictEqual(retrievedNote?.title, title);
  });

  test('should update a note', async () => {
      const originalTitle = 'Note to Update';
      const updatedTitle = 'Updated Note';
      const note = await Note.create(originalTitle);
      
      await Note.update(note.id, updatedTitle);
      const updatedNote = await Note.getById(note.id);
      
      assert.ok(updatedNote);
      assert.strictEqual(updatedNote?.title, updatedTitle);
  });

  test('should delete a note', async () => {
      const title = 'Note to Delete';
      const note = await Note.create(title);

      await Note.delete(note.id);
      const deletedNote = await Note.getById(note.id);

      assert.strictEqual(deletedNote, null);
  });

  test('should retrieve all notes', async () => {
      await Note.create('First Note');
      await Note.create('Second Note');

      const allNotes = await Note.getAll();
      assert.ok(allNotes.length >= 2); // Ensure at least two notes are present
  });

  test('should create a new cell', async () => {
    const notebookId = 1;
    const content = 'Test Cell';
    const type = 'code';
    const cell = await Cell.create(notebookId, null, null, content, type);
    assert.strictEqual(cell.content, content);
    assert.strictEqual(cell.position, 1); // First cell, so position should be 1
  });

  test('should retrieve cells by notebook ID', async () => {
    const notebookId = 1; // Replace with an actual notebook ID from your test data
    const content1 = 'Cell 1';
    const content2 = 'Cell 2';

    await Cell.create(notebookId, null, null, content1, 'code');
    await Cell.create(notebookId, null, null, content2, 'markdown');

    const cells = await Cell.getByNotebookId(notebookId);
    console.log(cells);
    // assert.ok(cells.length >= 2);
    assert.strictEqual(cells[0].notebookId, notebookId);
  });

  test('should retrieve report by notebook ID', async () => {
    const notebookId = 1; // Replace with an actual notebook ID from your test data
    const rows = await Note.reportQuery(notebookId);
    console.log("ROWS:", rows);
    assert.ok(rows.length > 0);
    // assert.strictEqual(cells[0].notebookId, notebookId);
  });

});
