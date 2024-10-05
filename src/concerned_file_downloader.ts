import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from './model/commands';
import { Logger } from './logger';
import { OSC633Parser, ParsedCommand } from './osc633_parser';
import { Util } from './util';
import { TerminalSessionManager } from './terminal_session_manager';

export enum DownloaderMode {
    Caputure,
    Save,
    Skip,
    Error,
    Unkown,
};

export class ConsernedFileDownloader {

    commandId: number;
    terminal: vscode.Terminal;
    parsedCommand: ParsedCommand;
    public mode: DownloaderMode = DownloaderMode.Unkown;
    commandAccessFile: string | undefined;
    downloadFile: string | undefined;
    fileContent: string | undefined;
    workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';

    constructor(commandId : number, terminal : vscode.Terminal, parsedCommand: ParsedCommand) {
        this.commandId = commandId;
        this.terminal = terminal;
        this.parsedCommand = parsedCommand;
    }

    detectFileAccessFromCommand() : boolean {
        const commandText = this.parsedCommand.command;
        const commandAccessFile  = Util.checkFileNameFromEditorCommand(commandText);
        if (commandAccessFile) {
            console.log("Detect file access from command :", commandAccessFile); 
            this.commandAccessFile = commandAccessFile;
            this.mode = DownloaderMode.Caputure; 
            return true;
        }
        return false;
    }

    async showConfirmationMessage(): Promise<ConsernedFileDownloader> {
        if (!this.commandAccessFile) {
            throw new Error('File path to download is not set');
        }
        const confirm = await vscode.window.showInformationMessage(
            `Do you want to download the file "${this.commandAccessFile}" ?`,
            { modal: true },
            'Yes', 'No'
        );
        if (confirm === 'Yes') {
            return this;
        } else {
            return Promise.reject(new Error('User canceled the download'));
        }
    }

    async caputureCommandAccessFile(): Promise<ConsernedFileDownloader> {
        if (!this.commandAccessFile) {
            throw new Error('Not found command access file');
        }
        TerminalSessionManager.disableShellIntegrationEvent(this.terminal);
        const catCommand = `cat ${this.commandAccessFile}`;
        this.terminal.sendText(catCommand);
        return this;
    }

    getUniqueDownloadFile(): string | undefined {
        let downloadFile = this.getDownloadFile();
        if (!downloadFile) {
            return;
        }
        let filePath = path.join(this.workspaceRoot, downloadFile);
        let file_suffix = 2;
        console.log("FilePath1:", filePath);
        while (fs.existsSync(filePath)) {
            downloadFile = this.getDownloadFile(file_suffix);
            if (!downloadFile) {
                return;
            }
            filePath = path.join(this.workspaceRoot, downloadFile);
            console.log("FilePath2:", filePath);
            file_suffix ++;
        }
        console.log("FilePath3:", filePath);
        return downloadFile;
    }

    async saveCommandAccessFile(): Promise<ConsernedFileDownloader>  {
        this.downloadFile = this.getUniqueDownloadFile();
        console.log("Download file : ", this.downloadFile);
        if (!this.downloadFile) {
            throw new Error('Downloaded save file name is not set');
        }
        let filePath = path.join(this.workspaceRoot, this.downloadFile);

        // cat コマンド実行後、data buffer がアイドルになるまで待つ必要がある。とりあえず1秒に設定
        await new Promise(resolve => setTimeout(resolve, 1000));
        const rawData = TerminalSessionManager.retrieveDataBuffer(this.terminal);
        if (!rawData) { 
            throw new Error('Could not get the buffer from session');
        }
        const parsedCommand = await OSC633Parser.parseOSC633AndCommand(rawData);
        if (!parsedCommand) {
            throw new Error('Could not parse the capture command');
        }
        try {
            const res = await fs.promises.writeFile(filePath, parsedCommand.output);
            console.log("Save file:", filePath, res);
            return this;
        } catch (err) {
            Logger.error(`Error downloading file: ${this.downloadFile} - ${err}`);
            throw err;
        }
    }

    getDownloadFile(suffixNumber : number = 0): string | undefined {
        if (!this.commandAccessFile) {
            return;
        }
        const terminalName = Util.toCamelCase(this.terminal.name);
        const downloadFileName = path.basename(this.commandAccessFile);
        if (suffixNumber > 0) {
            return  `${terminalName}__${downloadFileName}_${suffixNumber}`;
        } else {
            return  `${terminalName}__${downloadFileName}`;
        }
    }

    async updateCommandSuccess(): Promise<ConsernedFileDownloader> {
        if (!this.commandAccessFile) {
            throw new Error('Not found command access file');
        }
        if (!this.downloadFile) {
            throw new Error('Not found download file');
        }
        await Command.updateConceredFileOperation(
            this.commandId, 
            'downloaded', 
            this.commandAccessFile,
            this.downloadFile, 
        );
        const filePath = path.join(this.workspaceRoot, this.downloadFile);
        const fileUri = vscode.Uri.file(filePath);

        await Command.updatedWithoutTimestamp(
            this.commandId, 
            this.parsedCommand.command, 
            `[Download file here](${fileUri.toString()})`, 
            this.parsedCommand.cwd, 
            this.parsedCommand.exitCode || 0,
        );
        Logger.info(`Command with ID ${this.commandId} updated`);
        TerminalSessionManager.enableShellIntegrationEvent(this.terminal);
        return this;
    }

    async errorHandler(err: Error) {
        vscode.window.showErrorMessage(
            `Download canceled : ${err.message}`
        );
        TerminalSessionManager.enableShellIntegrationEvent(this.terminal);
        await Command.updatedWithoutTimestamp(
            this.commandId, 
            this.parsedCommand.command, 
            ``, 
            this.parsedCommand.cwd, 
            this.parsedCommand.exitCode || 0,
        );
        return this;
    }
}
