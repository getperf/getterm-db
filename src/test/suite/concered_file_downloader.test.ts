import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as sinon from 'sinon';
import proxyquire from 'proxyquire';
import { initializeTestDB } from './initialize_test_db';
import { ConsernedFileDownloader } from '../../concerned_file_downloader';
import { ParsedCommand } from '../../osc633_parser';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from '../../model/commands';
import { Session } from '../../model/sessions';

suite('ConsernedFileDownloader Test Suite', () => {
    let sandbox: sinon.SinonSandbox;
    let mockTerminal: vscode.Terminal;
    let parsedCommand: ParsedCommand;
    // let downloader: ConsernedFileDownloader;
    let db: sqlite3.Database;

    suiteSetup(function (done) {
        db = initializeTestDB(done);
        sandbox = sinon.createSandbox();
        const fsStub = {
            writeFileSync: sandbox.stub().returns(true),
        };
        const { ConcernedFileDownloader } = proxyquire('../../concerned_file_downloader', {
            'fs': fsStub,
        });
        mockTerminal = <vscode.Terminal><unknown>{ 
            name: 'Test Terminal', 
            sendText: sandbox.stub() 
        };
        parsedCommand = { command: 'vi /path/to/file', output: 'File content after download' } as ParsedCommand;
        // downloader = new ConcernedFileDownloader(1, mockTerminal, parsedCommand);
    });

    suiteTeardown(function (done) {
        sandbox.restore();
        db.close(done);
    });

    test('Test detectFileAccessFromCommand()', () => {
        const terminal = vscode.window.createTerminal("Test Terminal");
        // const parsedCommand = new ParsedCommand('vim file.txt', '', 0, '');
        const parsedCommand = { command: 'vi /path/to/file', output: 'File content after download' } as ParsedCommand;
        const downloader = new ConsernedFileDownloader(1, terminal, parsedCommand);
        assert.strictEqual(downloader.detectFileAccessFromCommand(), true);
    });

    test('should confirm file download', async () => {
        // const terminalStub = sandbox.createStubInstance(vscode.Terminal);
        const terminal = vscode.window.createTerminal('Test Terminal');
        const parsedCommand: ParsedCommand = { command: 'vi /test/file.txt', cwd: '/', exitCode: 0, output: '' };
        // const downloader = new ConsernedFileDownloader(1, terminalStub, parsedCommand);
        const downloader = new ConsernedFileDownloader(1, terminal, parsedCommand);

        // Stub the showInformationMessage
        const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves('Yes' as any);
        assert.strictEqual(downloader.detectFileAccessFromCommand(), true);
        await downloader.showConfirmationMessage();

        assert.strictEqual(showInformationMessageStub.calledOnce, true);
    });

    test('Test getUniqueDownloadFile()', async () => {
        const terminal = vscode.window.createTerminal("Test Terminal");
        const parsedCommand: ParsedCommand = { command: 'vi /test/file.txt', cwd: '/', exitCode: 0, output: '' };
        const downloader = new ConsernedFileDownloader(1, terminal, parsedCommand);
        downloader.commandAccessFile = "file.txt";

        const uniqueFile = downloader.getUniqueDownloadFile();
        assert.ok(uniqueFile); // Check if file name is generated
        assert.strictEqual(uniqueFile?.includes('file.txt'), true);
    });

    // test('should save captured file', async () => {
    //     // const terminalStub = sandbox.createStubInstance(vscode.Terminal);
    //     const terminal = vscode.window.createTerminal('Test Terminal');
    //     const parsedCommand: ParsedCommand = { command: 'vi /test/file.txt', cwd: '/', exitCode: 0, output: 'test content' };
    //     // const downloader = new ConsernedFileDownloader(1, terminalStub, parsedCommand);
    //     const downloader = new ConsernedFileDownloader(1, terminal, parsedCommand);

    //     sandbox.stub(fs.promises, 'writeFile').resolves();
    //     const uniqueFileStub = sandbox.stub(downloader, 'getUniqueDownloadFile').returns('testFile.txt');

    //     assert.strictEqual(downloader.detectFileAccessFromCommand(), true);
    //     await downloader
    //         .saveCommandAccessFile();

    //     assert.strictEqual(uniqueFileStub.calledOnce, true);
    // });

    test('Test updateCommandSuccess()', async () => {
        const terminal = vscode.window.createTerminal("Test Terminal");
        const parsedCommand: ParsedCommand = { command: 'vi /test/file.txt', cwd: '/', exitCode: 0, output: 'test content' };
        const downloader = new ConsernedFileDownloader(1, terminal, parsedCommand);
        downloader.commandAccessFile = "file.txt";
        downloader.downloadFile = "downloaded_file.txt";

        const sessionId = await Session.create('test_profile', '/path/to/exe', ['arg1'], 'remote_host', 'user');
        await Command.create(sessionId, 'vi /test/file.txt', 'output1', '/cwd', 0);

        await downloader.updateCommandSuccess();
        const command = await Command.getById(1);
        assert.strictEqual(command?.file_operation_mode, 'downloaded');
    });
});
