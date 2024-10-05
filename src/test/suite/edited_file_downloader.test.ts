import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import { EditedFileDownloader } from '../../edited_file_downloader';
import { initializeTestDB } from './initialize_test_db';
import { Session } from '../../model/sessions';
import { Command } from '../../model/commands';
import { Logger } from '../../logger';
import proxyquire from 'proxyquire';
import sinon from 'sinon'; 
import { ParsedCommand } from '../../osc633_parser';
import { TerminalSessionManager } from '../../terminal_session_manager';

suite('EditedFileDownloader', () => {
    let sandbox: sinon.SinonSandbox;
    let mockTerminal: vscode.Terminal;
    let parsedCommand: ParsedCommand;
    let downloader: EditedFileDownloader;

    // const fileName = 'testfile.txt';
    // const fileContent = 'This is a test file content';
    // sandbox = sinon.createSandbox();

    // const fsMock = {
    //     readFileSync: sinon.stub().returns(fileContent),
    //     writeFileSync: sandbox.stub()
    // };

    // // Use proxyquire to mock 'fs' module
    // const { EditedFileDownloader } = proxyquire('../../edited_file_downloader', {
    //     fs: fsMock
    // });

    let db: sqlite3.Database;

    suiteSetup(function (done) {
        db = initializeTestDB(done);
        sandbox = sinon.createSandbox();
        const fsStub = {
            writeFileSync: sandbox.stub().returns(true),
        };
        const { EditedFileDownloader } = proxyquire('../../edited_file_downloader', {
            'fs': fsStub,
        });
        mockTerminal = <vscode.Terminal><unknown>{ 
            name: 'Test Terminal', 
            sendText: sandbox.stub() 
        };
        parsedCommand = { command: 'vi /path/to/file', output: 'File content after download' } as ParsedCommand;
        downloader = new EditedFileDownloader(mockTerminal, parsedCommand);

    });

    suiteTeardown(function (done) {
        db.close(done);
        sandbox.restore();
        // const writeFileSyncStub = sandbox.stub(fs, 'writeFileSync');
    });

    // test('storeTerminalSessions should register session in TerminalSessionManager', () => {
    //     const setEditedFileDownloaderSpy = sandbox.spy(TerminalSessionManager, 'setEditedFileDownloader');
    //     downloader.fileName = 'testFile.txt';
    //     downloader.storeTerminalSessions();
    //     assert.strictEqual(setEditedFileDownloaderSpy.calledWith(mockTerminal, downloader), true);
    // });
    
    // test('storeTerminalSessions should throw error if fileName is not set', () => {
    //     downloader.fileName = undefined;
    //     assert.throws(() => downloader.storeTerminalSessions(), new Error('File name is not set'));
    // });

    test('captureDownloadFile should send the correct cat command to the terminal', async () => {
        downloader.downloadFilePath = '/path/to/file';
        await downloader.captureDownloadFile();
        assert.strictEqual((mockTerminal.sendText as sinon.SinonStub).calledWith('cat /path/to/file'), true);
    });

    test('saveEditedFile should save file and log success', async () => {
        sandbox.stub(vscode.workspace, 'workspaceFolders').value([{ uri: vscode.Uri.file('/workspace') }]);
        // const writeFileSyncStub = sandbox.stub(fs, 'writeFileSync');
        const writeFileStub = sandbox.stub(fs.promises, 'writeFile').resolves();

        const logInfoStub = sandbox.stub(console, 'log');
        downloader.downloadFilePath = '/path/to/file';
        downloader.fileName = 'testFile.txt';
        downloader.fileContent = 'File content after download';
        
        await downloader.saveEditedFile();
        
        assert.strictEqual(writeFileStub.calledWith('\\workspace\\file@testTerminal', 'File content after download'), true);
        // assert.strictEqual(logInfoStub.calledWith('Downloaded file: testFile.txt'), true);
    });

    test('saveEditedFile should throw error if fileName is not set', async () => {
        downloader.downloadFilePath = undefined;
        await assert.rejects(() => downloader.saveEditedFile(), { message: 'Downloaded save file name is not set' });
    });

    // test('showConfirmationMessage should return promise on Yes', async () => {
    //     const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');
    //     showInformationMessageStub.resolves('Yes' as any); // This returns an object with a `title` property
    //     downloader.downloadFilePath = '/path/to/file';
    //     await assert.doesNotReject(async () => await downloader.showConfirmationMessage());
    //     assert.strictEqual(showInformationMessageStub.called, true);
    // });

    test('showConfirmationMessage should reject on No', async () => {
        const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves('No' as any);
        downloader.downloadFilePath = '/path/to/file';
        await assert.rejects(() => downloader.showConfirmationMessage(), { message: 'User canceled the download' });
        assert.strictEqual(showInformationMessageStub.called, true);
    });

    test('updateCommand should update the command table after downloading', async () => {
        const commandUpdateStub = sandbox.stub(Command, 'updateConceredFileOperation').resolves();
        downloader.fileName = 'testFile.txt';
        downloader.downloadFilePath = '/path/to/file';
        
        await downloader.updateCommand(1);
        
        assert.strictEqual(commandUpdateStub.calledWith(1, 'downloaded', 'testFile.txt', '/path/to/file'), true);
    });

    test('errorHandler should display error message', () => {
        const showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage');
        const error = new Error('Test error');
        assert.throws(() => downloader.errorHandler(error), new Error('Method not implemented.'));
        assert.strictEqual(showErrorMessageStub.calledWith('Oops. Failed to download the edidted file.'), true);
    });

});
