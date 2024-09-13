// import * as vscode from "vscode";
// import * as sinon from "sinon";
// import { Note } from "../../model/notes";
// import { Cell } from "../../model/cells";
// import { strict as assert } from "assert";
// import { TerminalNotebookExporter } from "../../notebook_exporter";
// import { RawNotebookData } from "../../notebook_serializer";
// import { initializeTestDB } from "./initialize_test_db";
// import sqlite3 from "sqlite3";
// import { Session } from "../../model/sessions";

// // let createNoteStub: sinon.SinonStub;
// // let createCellStub: sinon.SinonStub;

// suite("TerminalNotebookExporter Tests", () => {
//   let db: sqlite3.Database;

//   suiteSetup(async function () {
//     db = await initializeTestDB(); // Use the real SQLite3 in-memory database
//     Note.setup(db);
//   });

//   suiteTeardown(function () {
//     db.close();
//   });

//   // let getByTitleStub: sinon.SinonStub;
//   // let createNoteStub: sinon.SinonStub;
//   // let deleteNoteStub: sinon.SinonStub;
//   // let deleteCellsByNotebookIdStub: sinon.SinonStub;
//   // let createCellStub: sinon.SinonStub;
//   // Setup stubs before each test
//   // suiteSetup(() => {
//   //     createNoteStub = sinon.stub(Note, 'create').resolves({ id: 1, title: 'test' });
//   //     createNoteStub = sinon.stub(Note, 'getByTitle').resolves({ id: 1, title: 'test' });
//   //     createCellStub = sinon.stub(Cell, 'create').resolves();
//   // getByTitleStub = sinon.stub(Note, 'getByTitle');
//   // createNoteStub = sinon.stub(Note, 'create');
//   // deleteNoteStub = sinon.stub(Note, 'delete');
//   // deleteCellsByNotebookIdStub = sinon.stub(Cell, 'deleteByNotebookId');
//   // createCellStub = sinon.stub(Cell, 'create');
//   // });
//   // Restore the original methods after each test
//   // suiteTeardown(() => {
//   //     sinon.restore();
//   // });
//   test("should save notebook correctly when no existing note", async function () {
//     // Define stubs behavior
//     // getByTitleStub.resolves(null);  // No existing note found
//     // createNoteStub.resolves({ id: 1, title: 'Test Notebook' });
//     // createCellStub.resolves(true);
//     const notebookData: RawNotebookData = {
//       cells: [
//         {
//           kind: vscode.NotebookCellKind.Code,
//           id: 75,
//           value: 'echo "Hello, World!"',
//           language: "shellscript",
//         },
//         {
//           kind: vscode.NotebookCellKind.Markup,
//           value: "# Markdown Title",
//           language: "shellscript",
//         },
//         {
//           kind: vscode.NotebookCellKind.Code,
//           id: 76,
//           value: "pwd",
//           language: "shellscript",
//         },
//       ],
//       metadata: { sessionId: 16 },
//     };
//     const notebookTitle = "Test Notebook";
//     const result = await TerminalNotebookExporter.saveNotebook(
//       notebookData,
//       notebookTitle
//     );

//     const session = await Session.getById(0);
//     console.log("SESSION:", session);
//     // const note = await Note.getAll();
//     // console.log("NOTE:", note);
//     // Fetch the saved note from the database
//     // const fetchedNote = await Note.getByTitle(notebookTitle);
//     // assert(fetchedNote !== null);
//     // assert.strictEqual(fetchedNote!.title, notebookTitle);

//     // sinon.assert.calledOnce(createNoteStub);
//     // sinon.assert.calledTwice(createCellStub);
//     // sinon.assert.calledOnce(getByTitleStub);
//     // sinon.assert.calledWith(createNoteStub, notebookTitle);
//     // sinon.assert.callCount(createCellStub, 3);
//     // });
//     // test('should delete existing note and its cells before creating a new one', async function () {
//     //     // Define stubs behavior
//     //     getByTitleStub.resolves({ id: 2, title: 'Existing Notebook' });
//     //     createNoteStub.resolves({ id: 3, title: 'New Notebook' });
//     //     createCellStub.resolves(true);
//     //     deleteNoteStub.resolves(true);
//     //     deleteCellsByNotebookIdStub.resolves(true);
//     //     const notebookData = {
//     //         cells: [
//     //             { kind: vscode.NotebookCellKind.Code, language: 'shellscript', id: 77, value: 'ls' }
//     //         ],
//     //         metadata: { sessionId: 17 }
//     //     };
//     //     const notebookTitle = 'New Notebook';
//     //     // Call the method under test
//     //     const result = await TerminalNotebookExporter.saveNotebook(notebookData, notebookTitle);
//     //     // Assert that the existing note and its cells were deleted
//     //     sinon.assert.calledOnce(deleteNoteStub);
//     //     sinon.assert.calledWith(deleteNoteStub, 2);
//     //     sinon.assert.calledOnce(deleteCellsByNotebookIdStub);
//     //     sinon.assert.calledWith(deleteCellsByNotebookIdStub, 2);
//     //     // Assert that a new note and cell were created
//     //     sinon.assert.calledOnce(createNoteStub);
//     //     sinon.assert.calledWith(createNoteStub, notebookTitle);
//     //     sinon.assert.calledOnce(createCellStub);
//   });
// });
