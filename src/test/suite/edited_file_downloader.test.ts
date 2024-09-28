import * as assert from 'assert';
import * as fs from 'fs';
import { EditedFileDownloader } from '../../edited_file_downloader';
import { Command } from '../../model/commands';
import { Logger } from '../../logger';
import sinon from 'sinon'; 

suite('EditedFileDownloader', () => {

    test('should download a file and return its content via method chaining', async () => {
        const fileName = 'testfile.txt';
        const fileContent = 'This is a test file content';
        const commandId = 1;

        const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns(fileContent);

        // Use method chaining for downloading and updating the command
        const downloader = await EditedFileDownloader
            .create()
            .setFileName(fileName)
            .download()
            .then(downloader => downloader.updateCommand(commandId));

        assert.strictEqual(downloader.fileContent, fileContent, 'File content should match');
        readFileSyncStub.restore();
    });

    test('should update command via method chaining', async () => {
        const fileName = 'testfile.txt';
        const commandId = 1;

        const updateFileStub = sinon.stub(Command, 'updateFileModifyOperation').resolves();

        // Use method chaining for updating the command
        await EditedFileDownloader
            .create()
            .setFileName(fileName)
            .download()
            .then(downloader => downloader.updateCommand(commandId));

        assert.strictEqual(updateFileStub.calledOnce, true);
        assert.strictEqual(updateFileStub.calledWith(commandId, 'updated', fileName, `/local/path/${fileName}`), true);
        updateFileStub.restore();
    });

    test('should throw an error when file name is not set', async () => {
        try {
            await EditedFileDownloader
                .create()
                .download(); // File name is not set
            assert.fail('Should have thrown an error');
        } catch (err) {
            assert.strictEqual((err as Error).message, 'File name is not set');
        }
    });
});
