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

suite('EditedFileDownloader', () => {
    const fileName = 'testfile.txt';
    const fileContent = 'This is a test file content';

    const fsMock = {
        readFileSync: sinon.stub().returns(fileContent)
    };

    // Use proxyquire to mock 'fs' module
    const { EditedFileDownloader } = proxyquire('../../edited_file_downloader', {
        fs: fsMock
    });

    let db: sqlite3.Database;
    suiteSetup(function (done) {
        db = initializeTestDB(done);
      });
    
      suiteTeardown(function (done) {
        db.close(done);
      });
    

    // test('should download a file and return its content via method chaining', async () => {
    //     const terminal = <vscode.Terminal>{};
    //     const sessionId = await Session.create('test_profile', '/path/to/exe', ['arg1'], 'host', 'user');
    //     const commandId = await Command.create(sessionId, 'vi testfile.txt', 'output', '/cwd', 0);
    //     const parsedCommand = new ParsedCommand();

        // const downloader = await EditedFileDownloader(terminal, parsedCommand)
        //     .setTerminalSession()
        //     .caputureEditedFile();

        // assert.strictEqual(downloader.fileContent, fileContent, 'File content should match');
    // });

    // test('should throw an error when file name is not set', async () => {
    //     try {
    //         await EditedFileDownloader
    //             .create()
    //             .download(); // File name is not set
    //         assert.fail('Should have thrown an error');
    //     } catch (err) {
    //         assert.strictEqual((err as Error).message, 'File name is not set');
    //     }
    // });
});
