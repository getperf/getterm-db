import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from './model/commands';
import { Logger } from './logger';
import { CommandParser, ParsedCommand } from './command_parser';
import { Util } from './util';
import { TerminalSessionManager } from './terminal_session_manager';
import { Config } from './config';

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

    // Short name that can be used as a file name
    termnalShortName: string;

    // Parsed command object
    parsedCommand: ParsedCommand; 

    // Current mode of the downloader
    public mode: DownloaderMode = DownloaderMode.Unkown; 

    // File path of edited command
    commandAccessFile: string | undefined; 

    // sudo command
    sudoCommand : string | null = null;

    // Download home directory
	downloadHome = Config.getInstance().getDownloadHome();

    // Download file path
    downloadFile: string | undefined; 

    // Content after cat command reading
    fileContent: string | undefined; 

    constructor(commandId : number, terminal : vscode.Terminal, parsedCommand: ParsedCommand) {
        this.commandId = commandId;
        this.terminal = terminal;
        this.termnalShortName= Util.toCamelCase(terminal.name); // CamelCase conversion of terminal name
        this.parsedCommand = parsedCommand;
    }
    
    /**
     * Searches the input command buffer for an editor command and returns the file name.
     * @param commandBuffer The string representing the command input (e.g., 'vi filename.txt')
     * @returns The file name if an editor command is found, otherwise undefined.
     */
    checkFileNameFromEditorCommand(commandBuffer: string): string | undefined {
        const commandParts = commandBuffer.trim().split(/\s+/);
        const editorIndex = commandParts.findIndex(part => 
            this.editorCommands.some(editor => part === editor)
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

    /**
     * Detects if the current command involves file access and switches the mode if necessary.
     * @returns True if file access is detected in the command; otherwise, false.
     */
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

    /**
     * Prompts the user for confirmation to download the accessed file.
     * @returns {Promise<ConsernedFileDownloader>} A promise that resolves to the downloader 
     * instance if confirmed; otherwise, rejects.
     * @throws An error if the file path is not set.
     */
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

    /**
     * Captures the content of the accessed file by executing a 'cat' command in the terminal.
     * @returns {Promise<ConsernedFileDownloader>} A promise that resolves to the downloader 
     * instance after capturing.
     * @throws An error if the command access file is not found.
     */
    async caputureCommandAccessFile(): Promise<ConsernedFileDownloader> {
        if (!this.commandAccessFile) {
            throw new Error('Not found command access file');
        }
        TerminalSessionManager.disableShellIntegrationEvent(this.terminal); // Disable shell events
        const commandText = `${this.sudoCommand ? this.sudoCommand + ' ' : ''}cat ${this.commandAccessFile}`;
        this.terminal.sendText(commandText); // Send 'cat' command to terminal
        this.mode = DownloaderMode.Save;
        return this;
    }

    /**
     * Generates a download filename, appending a suffix if specified.
     * @param {number} suffixNumber - Optional number to append to the filename for uniqueness.
     * @returns {string | undefined} The download filename or undefined if no file path is set.
     */
    getDownloadFile(suffixNumber : number = 0): string | undefined {
        if (!this.commandAccessFile) {
            return;
        }
        const downloadFileName = path.basename(this.commandAccessFile); // Extract base file name
        return suffixNumber > 0 ? `${downloadFileName}_${suffixNumber}` : downloadFileName;
    }

    /**
     * Generates an absolute path for the download file within the designated directory.
     * @param downloadFile - The name of the file to be downloaded.
     * @returns The full path to the download file in the specified terminal directory.
     */
    getAbsoluteDownloadPath(downloadFile: string): string {
        return path.join(this.downloadHome, this.termnalShortName, downloadFile);
    }

    /**
     * Generates a unique filename for the downloaded file by checking for existing files
     * and appending a numeric suffix if necessary to avoid naming conflicts.
     * @returns {string | undefined} The unique filename, or undefined if no filename is generated.
     */
    getUniqueDownloadFile(): string | undefined {
        let downloadFile = this.getDownloadFile();
        if (!downloadFile) {
            return;
        }
        let filePath = this.getAbsoluteDownloadPath(downloadFile);
        let file_suffix = 2;
        // Check if file exists and modify name to ensure uniqueness
        while (fs.existsSync(filePath)) {
            downloadFile = this.getDownloadFile(file_suffix);
            if (!downloadFile) {
                return;
            }
            filePath = this.getAbsoluteDownloadPath(downloadFile);
            file_suffix ++;
        }
        return downloadFile;
    }

    /**
     * Ensures that the designated download directory (".getterm" folder) exists.
     * Creates the directory if it does not exist.
     */
    private ensureDownloadDirectoryExists() {
        const downloadDirectory = path.join(this.downloadHome, this.termnalShortName);
        if (!fs.existsSync(downloadDirectory)) {
            fs.mkdirSync(downloadDirectory);
            Logger.info(`Created config directory: ${downloadDirectory}`);
        }
    }

    /**
     * Saves the captured file content from the terminal to the download directory.
     * @returns {Promise<ConsernedFileDownloader>} A promise that resolves to the 
     * downloader instance after saving.
     * @throws Throws an error if the buffer retrieval or file save operation fails.
     */
    async saveCommandAccessFile(): Promise<ConsernedFileDownloader>  {
        this.ensureDownloadDirectoryExists();
        this.downloadFile = this.getUniqueDownloadFile(); // Get unique file name
        console.log("Download file : ", this.downloadFile);
        if (!this.downloadFile) {
            throw new Error('Downloaded save file name is not set');
        }
        let filePath = this.getAbsoluteDownloadPath(this.downloadFile);

        // Wait for terminal data buffer to stabilize (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Retrieve terminal buffer data
        const rawData = TerminalSessionManager.retrieveDataBuffer(this.terminal); 
        if (!rawData) { 
            throw new Error('Could not get the buffer from session');
        }

        const commandText = `${this.sudoCommand ? this.sudoCommand + ' ' : ''}cat ${this.commandAccessFile}`;
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

    /**
     * Updates the command database entry to reflect a successful file download.
     * Links the downloaded file to the command and provides access from the database entry.
     * @returns {Promise<ConsernedFileDownloader>} A promise that resolves to the downloader 
     * instance after updating.
     * @throws Throws an error if the file or command ID is missing.
     */
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
        const filePath = this.getAbsoluteDownloadPath(this.downloadFile);
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

    /**
     * Handles any errors encountered during the file download process.
     * Notifies the user, updates the command status, and resets to error mode.
     * @param {Error} err - The error that occurred during processing.
     * @returns {Promise<ConsernedFileDownloader>} A promise that resolves to the downloader 
     * instance after handling the error.
     */
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
