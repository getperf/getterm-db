import * as fs from 'fs';
import * as path from 'path';
import { Command } from './model/commands';
import { Logger } from './logger';

export class EditedFileDownloader {

    fileName: string | undefined;
    fileContent: string | undefined;

    static create(): EditedFileDownloader {
        return new EditedFileDownloader();
    }

    /**
     * Sets the file name to be downloaded.
     * @param fileName The name of the file to be downloaded.
     */
    setFileName(fileName: string): EditedFileDownloader {
        this.fileName = fileName;
        return this;
    }

    /**
     * Downloads the content of the file from the remote system via the terminal.
     */
    async download(): Promise<EditedFileDownloader> {
        if (!this.fileName) {
            throw new Error('File name is not set');
        }
        try {
            // Simulating the download by reading the file (this should be replaced with SSH logic)
            const filePath = path.join('/remote/path', this.fileName);
            this.fileContent = fs.readFileSync(filePath, 'utf8');
            Logger.info(`Downloaded file: ${this.fileName}`);
            return this;
        } catch (err) {
            Logger.error(`Error downloading file: ${this.fileName} - ${err}`);
            throw err;
        }
    }

    /**
     * Updates the command table after a file download operation.
     * @param commandId The ID of the command to be updated.
     */
    async updateCommand(commandId: number): Promise<EditedFileDownloader> {
        if (!this.fileName) {
            throw new Error('File name is not set');
        }
        const downloadFilePath = path.join('/local/path', this.fileName); // Define local path
        await Command.updateFileModifyOperation(commandId, 'updated', this.fileName, downloadFilePath);
        Logger.info(`Command with ID ${commandId} updated with file path ${downloadFilePath}`);
        return this;
    }
}
