import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { ConsernedFileDownloader } from '../../concerned_file_downloader';
import { ParsedCommand } from '../../osc633_parser';
import * as fs from 'fs';
import * as path from 'path';

suite('ConsernedFileDownloader Test Suite', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
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
});
