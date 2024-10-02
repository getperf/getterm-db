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
    Skip,
    Error,
    Unkown,
};

export class EditedFileDownloader {

    public mode: EditedFileDownloaderMode = EditedFileDownloaderMode.Unkown;
    downloadFilePath: string | undefined;
    fileName: string | undefined;
    fileContent: string | undefined;
    terminal: vscode.Terminal;
    parsedCommand: ParsedCommand;

    constructor(terminal : vscode.Terminal, parsedCommand: ParsedCommand) {
        this.terminal = terminal;
        this.parsedCommand = parsedCommand;
    }

    storeTerminalSessions(): EditedFileDownloader {
        if (!this.fileName) {
            throw new Error('File name is not set');
        }
        TerminalSessionManager.setEditedFileDownloader(this.terminal, this);
        return this;
    }

    resetTerminalSessions(): EditedFileDownloader {
        TerminalSessionManager.setEditedFileDownloader(this.terminal, undefined);
        return this;
    }

    checkRunningMode() : boolean {
        if (this.mode in [EditedFileDownloaderMode.Caputure]) { 
            this.mode = EditedFileDownloaderMode.Save;
            return true; 
        }
        const commandText = this.parsedCommand.command;
        const fileNameFromEditorCommand  = Util.checkFileNameFromEditorCommand(commandText);
        if (fileNameFromEditorCommand) { 
            this.downloadFilePath = fileNameFromEditorCommand;
            this.mode = EditedFileDownloaderMode.Caputure; 
            return true;
        }
        return false;
    }

    async showConfirmationMessage(): Promise<EditedFileDownloader> {
        if (!this.downloadFilePath) {
            throw new Error('File path to download is not set');
        }
        const confirm = await vscode.window.showInformationMessage(
            `Do you want to download the file "${this.downloadFilePath}" that was edited?`,
            { modal: true },
            'Yes', 'No'
        );
        if (confirm === 'Yes') {
            return this;
        } else {
            return Promise.reject(new Error('User canceled the download'));
        }
    }

    async captureDownloadFile(): Promise<EditedFileDownloader> {
        if (!this.downloadFilePath) {
            throw new Error('File path to download is not set');
        }
        const catCommand = `cat ${this.downloadFilePath}`;
        this.terminal.sendText(catCommand);
        return this;
    }

    async saveEditedFile(): Promise<EditedFileDownloader>  {
        this.fileName = this.getFileName();
        if (!this.fileName) {
            throw new Error('Downloaded save file name is not set');
        }
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
        const filePath = path.join(workspaceRoot, this.fileName);
        this.fileContent = this.parsedCommand.output;
        try {
            console.log("SAVEEDITEDFILE:", filePath, this.fileContent);
            const res = await fs.promises.writeFile(filePath, this.fileContent);
            console.log("SAVEEDITEDFILE2:", res);
            Logger.info(`Downloaded file: ${this.fileName}`);
            return this;
        } catch (err) {
            Logger.error(`Error downloading file: ${this.fileName} - ${err}`);
            throw err;
        }
    }

    getFileName(suffixNumber : number = 0): string | undefined {
        if (!this.downloadFilePath) {
            return;
        }
        const terminalName = Util.toCamelCase(this.terminal.name);
        let baseName = path.basename(this.downloadFilePath);
        if (suffixNumber > 0) {
            return  `${baseName}@${terminalName}_${suffixNumber}`;
        } else {
            return  `${baseName}@${terminalName}`;
        }
    }

    /**
     * Updates the command table after a file download operation.
     * @param commandId The ID of the command to be updated.
     */
    async updateCommand(commandId: number): Promise<EditedFileDownloader> {
        if (!this.fileName || !this.downloadFilePath) {
            throw new Error('File name is not set');
        }
        await Command.updateFileModifyOperation(commandId, 'updated', this.fileName, this.downloadFilePath);
        Logger.info(`Command with ID ${commandId} updated with ${this.fileName}`);
        return this;
    }

    async updateNotebook(commandId: number): Promise<EditedFileDownloader> {
        console.log("updateNotebook");
        return this;
    }

    errorHandler(err: Error) {
        vscode.window.showErrorMessage(
            `Oops. Failed to download the edidted file.`
        );
        throw new Error('Method not implemented.');
    }
}
