import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from './model/commands';
import { Logger } from './logger';
import { ParsedCommand } from './osc633_parser';
import { Util } from './util';
import { TerminalSessionManager } from './terminal_session_manager';

export enum EditedFileDownloaderMode {
    Caputure,
    Save,
    Unkown,
};

export class EditedFileDownloader {
    public mode: EditedFileDownloaderMode = EditedFileDownloaderMode.Unkown;
    fileName: string | undefined;
    fileContent: string | undefined;
    terminal: vscode.Terminal;
    parsedCommand: ParsedCommand;

    constructor(terminal : vscode.Terminal, parsedCommand: ParsedCommand) {
        this.terminal = terminal;
        this.parsedCommand = parsedCommand;
    }

    /**
     * Sets the file name to be downloaded.
     * @param fileName The name of the file to be downloaded.
     */
    setFileName(fileName: string): EditedFileDownloader {
        this.fileName = fileName;
        return this;
    }

    setTerminal(terminal: vscode.Terminal): EditedFileDownloader {
        this.terminal = terminal;
        return this;
    }

    setParsedCommand(parsedCommand: ParsedCommand): EditedFileDownloader {
        this.parsedCommand = parsedCommand;
        return this;
    }

    storeTerminalSessions(): EditedFileDownloader {
        if (!this.fileName) {
            throw new Error('File name is not set');
        }
        TerminalSessionManager.setUpdatingFlag(this.terminal, true);
        TerminalSessionManager.setUpdateFilePath(this.terminal, this.fileName);
        return this;
    }

    resetTerminalSessions(): EditedFileDownloader {
        TerminalSessionManager.setUpdatingFlag(this.terminal, false);
        TerminalSessionManager.setUpdateFilePath(this.terminal, undefined);
        return this;
    }

    checkRunningMode() : boolean {
        const commandText = this.parsedCommand.command;
        const updatingFlag = TerminalSessionManager.getUpdatingFlag(this.terminal);
        if (updatingFlag) { 
            this.mode =  EditedFileDownloaderMode.Save; 
            return true;
        }
        const fileNameFromEditorCommand  = Util.checkFileNameFromEditorCommand(commandText);
        if (fileNameFromEditorCommand) { 
            this.mode = EditedFileDownloaderMode.Caputure; 
            return true;
        }
        return false;
    }


    /**
     * Confirm the download process.
     */
    async showConfirmationMessage(): Promise<EditedFileDownloader> {
        if (!this.fileName) {
            throw new Error('File name is not set');
        }
        const confirm = await vscode.window.showInformationMessage(
            `Do you want to download the file "${this.fileName}" that was edited?`,
            { modal: true },
            'Yes', 'No'
        );
        if (confirm === 'Yes') {
            return this;
        } else {
            return Promise.reject(new Error('User canceled the download'));
        }
    }

    /**
     * Downloads the content of the file from the remote system via the terminal.
     */
    async captureDownloadFile(): Promise<EditedFileDownloader> {
        if (!this.fileName) {
            throw new Error('File name is not set');
        }
        // try {
        //     // Simulating the download by reading the file (this should be replaced with SSH logic)
        //     const filePath = path.join('/remote/path', this.fileName);
        //     this.fileContent = fs.readFileSync(filePath, 'utf8');
        //     Logger.info(`Downloaded file: ${this.fileName}`);
        //     return this;
        // } catch (err) {
        //     Logger.error(`Error downloading file: ${this.fileName} - ${err}`);
        //     throw err;
        // }
        return this;
    }

    async saveEditedFile(): Promise<EditedFileDownloader>  {
        if (!this.fileName) {
            throw new Error('File name is not set');
        }
        return this;
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

    async updateNotebook(): Promise<EditedFileDownloader> {
        console.log("updateNotebook");
        return this;
    }

}
