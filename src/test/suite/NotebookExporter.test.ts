import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as assert from 'assert';
import { Session } from '../../model/Session';
import { Command } from '../../model/Command';
import { Note } from '../../model/Note';
import { Cell } from '../../model/Cell';
import { initializeTestDB } from './initializeTestDB';
import { RawNotebookData } from '../../NotebookSerializer';
import { TerminalNotebookExporter } from '../../NotebookExporter';

suite('TerminalNotebookExporter Tests', function () {
  let db: sqlite3.Database;

  // Setup in-memory database before tests
  suiteSetup(function (done) {
    db = initializeTestDB(done);
  });

  suiteTeardown(function (done) {
    db.close(done);
  });

  test("should save notebook correctly when no existing note", async () => {
    const notebookData: RawNotebookData = {
      cells: [
        {
          kind: vscode.NotebookCellKind.Code,
          id: 75,
          value: 'echo "Hello, World!"',
          language: "shellscript",
        },
        {
          kind: vscode.NotebookCellKind.Markup,
          value: "# Markdown Title",
          language: "shellscript",
        },
        {
          kind: vscode.NotebookCellKind.Code,
          id: 76,
          value: "pwd",
          language: "shellscript",
        },
      ],
      metadata: { sessionId: 16 },
    };
    const notebookTitle = "Test Notebook";
    const result = await TerminalNotebookExporter.saveNotebook(
      notebookData,
      notebookTitle
    );

    const note = await Note.getAll();
    console.log("NOTE:", result);
    const fetchedNote = await Note.getByTitle(notebookTitle);
    assert.ok(fetchedNote !== null);
    assert.strictEqual(fetchedNote!.title, notebookTitle);
  });

  test('should update an existing notebook and delete its old cells before saving new ones', async function () {
    const notebookData = {
        cells: [
            { id: 1, kind: vscode.NotebookCellKind.Code, value: 'print("Updated")', language: 'python' }
        ],
        metadata: { sessionId: 10 }
    };

    const notebookTitle = 'Test Notebook';
    await TerminalNotebookExporter.saveNotebook(notebookData, notebookTitle);

    const updatedNote = await Note.getByTitle(notebookTitle);
    assert.ok(updatedNote, 'Note should be updated');
    const cells = await Cell.getByNotebookId(updatedNote.id);
    assert.equal(cells.length, 1, 'Old cells should be deleted, only 1 cell should exist');
    assert.equal(cells[0].content, 'print("Updated")', 'Cell value should be updated');
  });

});
