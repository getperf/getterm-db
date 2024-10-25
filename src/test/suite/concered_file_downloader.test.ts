import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as sinon from 'sinon';
import proxyquire from 'proxyquire';
import { initializeTestDB } from './initialize_test_db';
import { ConsernedFileDownloader } from '../../concerned_file_downloader';
import { ParsedCommand } from '../../command_parser';
import * as fs from 'fs';
import { Command } from '../../model/commands';
import { Session } from '../../model/sessions';
import { TerminalSessionManager } from '../../terminal_session_manager';

suite('ConsernedFileDownloader Test Suite', () => {
    let sandbox: sinon.SinonSandbox;
    let db: sqlite3.Database;
    let ConcernedFileDownloader: typeof ConsernedFileDownloader;
    let mockTerminal: vscode.Terminal;
    let parsedCommand: ParsedCommand;

    suiteSetup(function (done) {
        db = initializeTestDB(done);
        sandbox = sinon.createSandbox();
        
        // Stub fs module
        const fsStub = { writeFileSync: sandbox.stub().returns(true) };
        ConcernedFileDownloader = proxyquire('../../concerned_file_downloader', { 'fs': fsStub }).ConsernedFileDownloader;

        // Mock terminal and parsed command
        mockTerminal = { name: 'Test Terminal', sendText: sandbox.stub() } as unknown as vscode.Terminal;
        parsedCommand = { command: 'vi /path/to/file', output: 'File content after download' } as ParsedCommand;
    });

    suiteTeardown(function (done) {
        sandbox.restore();
        db.close(done);
    });

    test('detectFileAccessFromCommand should return true for valid file access', () => {
        const downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);
        assert.strictEqual(downloader.detectFileAccessFromCommand(), true);
    });

    test('should return the file name for vi command', () => {
        const downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);
        const result = downloader.checkFileNameFromEditorCommand('vi myfile.txt');
        assert.strictEqual(result, 'myfile.txt');
    });

    // test('should return command and arguments when sudo and editor command are present', () => {
    //     const downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);
    //     const result = downloader.checkFileNameFromEditorCommand('sudo -u user1 vi hoge.txt');
    //     assert.strictEqual(result, 'hoge.txt');
    //     assert.strictEqual(downloader.sudoCommand, 'sudo -u user1');
    // });

    test('should return the file name for emacs command', () => {
        const downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);
        const result = downloader.checkFileNameFromEditorCommand('emacs script.sh');
        assert.strictEqual(result, 'script.sh');
    });

    test('should return undefined for non-editor commands', () => {
        const downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);
        const result = downloader.checkFileNameFromEditorCommand('ls -al');
        assert.strictEqual(result, undefined);
    });

    test('should return undefined if no file name is provided', () => {
        const downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);
        const result = downloader.checkFileNameFromEditorCommand('vi');
        assert.strictEqual(result, undefined);
    });

    test('should handle extra spaces', () => {
        const downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);
        const result = downloader.checkFileNameFromEditorCommand('  nano   notes.txt  ');
        assert.strictEqual(result, 'notes.txt');
    });

    test('should confirm file download via information message', async () => {
        const downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);

        // Stub showInformationMessage
        const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves('Yes' as any);

        assert.strictEqual(downloader.detectFileAccessFromCommand(), true);
        await downloader.showConfirmationMessage();

        assert.strictEqual(showInfoStub.calledOnce, true);
    });

    test('getUniqueDownloadFile should return unique filename with original file included', () => {
        const downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);
        downloader.commandAccessFile = 'file.txt';

        const uniqueFile = downloader.getUniqueDownloadFile();
        assert.ok(uniqueFile);
        assert.strictEqual(uniqueFile.includes('file.txt'), true);
    });

    test('should save captured file correctly', async () => {
        const downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);

        // Stub methods for file saving
        sandbox.stub(fs.promises, 'writeFile').resolves();
        const uniqueFileStub = sandbox.stub(downloader, 'getUniqueDownloadFile').returns('testFile.txt');

        TerminalSessionManager.pushDataBuffer(mockTerminal, 'cat /path/to/file; this is a test');

        assert.strictEqual(downloader.detectFileAccessFromCommand(), true);
        await downloader.saveCommandAccessFile();

        assert.strictEqual(uniqueFileStub.calledOnce, true);
    });

    test('updateCommandSuccess should mark command as downloaded', async () => {
        const downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);
        downloader.commandAccessFile = 'file.txt';
        downloader.downloadFile = 'downloaded_file.txt';

        const sessionId = await Session.create('test_profile', '/path/to/exe', ['arg1'], 'remote_host', 'user');
        await Command.create(sessionId, 'vi /test/file.txt', 'output1', '/cwd', 0);

        await downloader.updateCommandSuccess();
        const command = await Command.getById(1);

        assert.strictEqual(command?.file_operation_mode, 'downloaded');
    });
});
