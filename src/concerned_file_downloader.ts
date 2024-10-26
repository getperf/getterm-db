import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from './model/commands';
import { Logger } from './logger';
import { CommandParser, ParsedCommand } from './command_parser';
import { Util } from './util';
import { TerminalSessionManager } from './terminal_session_manager';

// Downloader mode types to handle different states of downloading file
export enum DownloaderMode {
    Caputure,
    Save,
    Skip,
    Error,
    Unkown,
};

/*
 * A class that detects a file editing command and download.
 * executes "cat file name" in that case, saves the execution result in a file, 
 * and updates the command management table.
 */

export class ConsernedFileDownloader {
    private editorCommands = ['vi', 'vim', 'nano', 'emacs'];

    // ID of the file editing command. eg vi test.txt
    commandId: number; 

    // Terminal from which the command is executed
    terminal: vscode.Terminal; 

    // Parsed command object
    parsedCommand: ParsedCommand; 

    // Current mode of the downloader
    public mode: DownloaderMode = DownloaderMode.Unkown; 

    // File path of edited command
    commandAccessFile: string | undefined; 

    // sudo command
    sudoCommand : string | null = null;

    // Download file path
    downloadFile: string | undefined; 

    // Content after cat command reading
    fileContent: string | undefined; 

    // Workspace root directory
    workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || ''; 

    constructor(commandId : number, terminal : vscode.Terminal, parsedCommand: ParsedCommand) {
        this.commandId = commandId;
        this.terminal = terminal;
        this.parsedCommand = parsedCommand;
    }
    
    /**
     * Searches the input command buffer for an editor command and returns the file name.
     * @param commandBuffer The string representing the command input (e.g., 'vi filename.txt')
     * @returns The file name if an editor command is found, otherwise undefined.
     */
    checkFileNameFromEditorCommand(commandBuffer: string): string | undefined {
        // console.log("commandBuffer: ", commandBuffer);
        const commandParts = commandBuffer.trim().split(/\s+/);
        const editorIndex = commandParts.findIndex(part => 
            this.editorCommands.some(editor => part.includes(editor))
        );
        if (editorIndex === -1) {
            this.sudoCommand = null;
            return undefined;
        }
        const fileName = commandParts[editorIndex + 1];
        if (!fileName) {
            this.sudoCommand = null;
            return undefined;
        }
        if (commandParts[0] === 'sudo') {
            this.sudoCommand = commandParts.slice(0, editorIndex).join(' ').trim();
        } else {
            this.sudoCommand = null;
        }
        return fileName;
    }

    // Detects if the command is trying to access a file
    detectFileAccessFromCommand() : boolean {
        const commandText = this.parsedCommand.command;
        // Check if command accesses a file
        const commandAccessFile  = this.checkFileNameFromEditorCommand(commandText); 
        if (commandAccessFile) {
            console.log("Detect file access from command :", commandAccessFile); 
            this.commandAccessFile = commandAccessFile;
            this.mode = DownloaderMode.Caputure; // Switch mode to capture
            return true;
        }
        return false;
    }

    // Asks the user for confirmation to download the accessed file
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
            this.mode = DownloaderMode.Skip; // Skip if user rejects
            return Promise.reject(new Error('User canceled the download'));
        }
    }

    // Captures the file content by running the 'cat' command
    async caputureCommandAccessFile(): Promise<ConsernedFileDownloader> {
        if (!this.commandAccessFile) {
            throw new Error('Not found command access file');
        }
        TerminalSessionManager.disableShellIntegrationEvent(this.terminal); // Disable shell events
        // const catCommand = `${this.sudoCommand} cat ${this.commandAccessFile}`;
        // const commandText = this.sudoCommand ? this.sudoCommand + ' ' : '' +
        //     `cat ${this.commandAccessFile}`;
        const commandText = `${this.sudoCommand ? this.sudoCommand + ' ' : ''}cat ${this.commandAccessFile}`;
        this.terminal.sendText(commandText); // Send 'cat' command to terminal
        this.mode = DownloaderMode.Save;
        return this;
    }

    // Generates a name for the downloaded file
    getDownloadFile(suffixNumber : number = 0): string | undefined {
        if (!this.commandAccessFile) {
            return;
        }
        const terminalName = Util.toCamelCase(this.terminal.name); // CamelCase conversion of terminal name
        const downloadFileName = path.basename(this.commandAccessFile); // Extract base file name
        if (suffixNumber > 0) {
            return  `${terminalName}__${downloadFileName}_${suffixNumber}`;
        } else {
            return  `${terminalName}__${downloadFileName}`;
        }
    }

    // Generate download filenames by ensuring that downloaded filenames are unique
    getUniqueDownloadFile(): string | undefined {
        let downloadFile = this.getDownloadFile();
        if (!downloadFile) {
            return;
        }
        let filePath = path.join(this.workspaceRoot, downloadFile);
        let file_suffix = 2;
        // Check if file exists and modify name to ensure uniqueness
        while (fs.existsSync(filePath)) {
            downloadFile = this.getDownloadFile(file_suffix);
            if (!downloadFile) {
                return;
            }
            filePath = path.join(this.workspaceRoot, downloadFile);
            file_suffix ++;
        }
        return downloadFile;
    }

    // Saves the captured file content to the workspace
    async saveCommandAccessFile(): Promise<ConsernedFileDownloader>  {
        this.downloadFile = this.getUniqueDownloadFile(); // Get unique file name
        console.log("Download file : ", this.downloadFile);
        if (!this.downloadFile) {
            throw new Error('Downloaded save file name is not set');
        }
        let filePath = path.join(this.workspaceRoot, this.downloadFile);

        // Wait for terminal data buffer to stabilize (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Retrieve terminal buffer data
        const rawData = TerminalSessionManager.retrieveDataBuffer(this.terminal); 
        if (!rawData) { 
            throw new Error('Could not get the buffer from session');
        }

        const commandText = `${this.sudoCommand ? this.sudoCommand + ' ' : ''}cat ${this.commandAccessFile}`;

        // const commandText = this.sudoCommand ? this.sudoCommand + ' ' : '' +
        //     `cat ${this.commandAccessFile}`;
        const output = await CommandParser.extractCommandOutput(rawData, commandText); 
        try {
            await fs.promises.writeFile(filePath, output);
            console.log("Save file : ", filePath);
            return this;
        } catch (err) {
            Logger.error(`Error downloading file: ${this.downloadFile} - ${err}`);
            throw err;
        }
    }

    // Updates the command entry in the database after success
    async updateCommandSuccess(): Promise<ConsernedFileDownloader> {
        if (!this.commandAccessFile) {
            throw new Error('Not found command access file');
        }
        if (!this.downloadFile) {
            throw new Error('Not found download file');
        }
        const row1 = await Command.updateConceredFileOperation(
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
        // Re-enable shell events
        TerminalSessionManager.enableShellIntegrationEvent(this.terminal); 
        return this;
    }

    // Handles errors during the file download process
    async errorHandler(err: Error) {
        vscode.window.showErrorMessage(
            `Download canceled : ${err.message}`
        );
        this.mode = DownloaderMode.Error;
        // Re-enable shell events
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
