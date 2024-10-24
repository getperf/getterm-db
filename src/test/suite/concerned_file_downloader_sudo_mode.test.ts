import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConsernedFileDownloader } from '../../concerned_file_downloader';
import { ParsedCommand } from '../../command_parser';

suite('ConsernedFileDownloader sudo mode Test Suite', () => {
    let downloader: ConsernedFileDownloader;
    let mockTerminal: vscode.Terminal;
    let parsedCommand: ParsedCommand;

    setup(function () {
        downloader = new ConsernedFileDownloader(1, mockTerminal, parsedCommand);
    });

    test('should return the file name for sudo -u user1 vi hoge.txt', () => {
        const command = 'sudo -u user1 vi hoge.txt';
        const result = downloader.checkFileNameFromEditorCommand(command);

        assert.strictEqual(downloader.sudoCommand, 'sudo -u user1');
        assert.strictEqual(result, 'hoge.txt');
    });

    test('should return file name and no sudo command for vi', () => {
        const result = downloader.checkFileNameFromEditorCommand('vi hoge.txt');
        assert.strictEqual(downloader.sudoCommand, null);
        assert.strictEqual(result, 'hoge.txt');
    });

    test('should return file name and sudo command for sudo with options', () => {
        const result = downloader.checkFileNameFromEditorCommand('sudo -E vi hoge.txt');
        assert.strictEqual(downloader.sudoCommand, 'sudo -E');
        assert.strictEqual(result, 'hoge.txt');
    });

    test('should return undefined for sudo ls (non-editor command)', () => {
        const result = downloader.checkFileNameFromEditorCommand('sudo ls');
        assert.strictEqual(downloader.sudoCommand, null);
        assert.strictEqual(result, undefined);
    });

    test('should return undefined for sudo vi without file name', () => {
        const result = downloader.checkFileNameFromEditorCommand('sudo vi');
        assert.strictEqual(downloader.sudoCommand, null);
        assert.strictEqual(result, undefined);
    });

    test('should return file name and no sudo command for vi with file name', () => {
        const result = downloader.checkFileNameFromEditorCommand('vi hoge.txt');
        assert.strictEqual(downloader.sudoCommand, null);
        assert.strictEqual(result, 'hoge.txt');
    });

});
