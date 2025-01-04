import * as assert from 'assert';
import * as vscode from 'vscode';
import { TerminalNotebookHandler } from '../../NotebookHandler';

suite('TerminalNotebookHandler Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('createEmptyNotebook should return an empty notebook structure', () => {
        const handler = new TerminalNotebookHandler();
        const notebook = handler.createEmptyNotebook();
        assert.deepStrictEqual(notebook, { cells: [] });
    });

    test('defaultUri should return a valid URI', () => {
        const handler = new TerminalNotebookHandler();
        const uri = handler.defaultUri();
        assert.ok(uri.fsPath.endsWith('.getterm'));
    });

});
