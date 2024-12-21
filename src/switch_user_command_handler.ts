import * as vscode from 'vscode';
import { Command } from "./model/commands";
import { XtermParser } from './xterm_parser';
import { TerminalSessionManager } from './terminal_session_manager';
import { Logger } from './logger';

/**
 * SwitchUserCommandHandler manages detection and handling of `su` commands within a terminal session.
 * It interacts with a command buffer to identify `su` command usage, updates a command table entry,
 * and handles data retrieval through the terminal session manager.
 */
export class SwitchUserCommandHandler {
    private terminal: vscode.Terminal;
    private commandBuffer: string;
    private sessionId: number;
    commandId: number = 0;

    /**
     * Initializes the SwitchUserCommandHandler with the current terminal, session ID, and command buffer.
     * @param terminal - The active vscode.Terminal instance
     * @param sessionId - Unique identifier for the session
     * @param commandBuffer - Buffer containing the command to process
     */
    constructor(terminal: vscode.Terminal, sessionId: number, commandBuffer: string) {
        this.terminal = terminal;
        this.sessionId = sessionId;
        this.commandBuffer = commandBuffer;
    }

    /**
     * Detects the presence of an `su` command in the terminal output.
     * 
     * This method first logs the command buffer content for debugging, then
     * parses the terminal output buffer using the XtermParser instance. Escape
     * sequences are replaced with spaces, making the plain text easier to search
     * for the `su` command. After parsing, it examines the last line of the command
     * buffer output for any instance of the `su` command.
     * 
     * @returns {Promise<boolean>} - Returns `true` if the `su` command is detected, 
     * otherwise returns `false`.
     */
    async detectSuCommand(): Promise<boolean> {
        Logger.debug(`Detecting su command from buffer: ${this.commandBuffer}`);
        
        // Parse the terminal buffer for plain-text command detection
        const xtermParser = XtermParser.getInstance();
        const commandText = await xtermParser.parseTerminalBuffer(this.commandBuffer, true);
        // Extract and trim the last line of the parsed command output
        const commandLastLine = commandText.trim().split(/\r?\n/).pop() || '';
        Logger.debug(`Checking su command in last line: ${commandLastLine}`);
        
        // Split the command line text into parts and check for 'su' command
        const commandParts = commandLastLine.trim().split(/\s+/);
        if (commandParts.includes('su')) {
            console.log("Detected 'su' command.");
            return true;
        }
        return false;
    }

    /**
     * Updates the command table by parsing the terminal buffer, creating a new command entry, and saving it.
     * Also sets the command end timestamp.
     * @returns The generated command ID as a Promise<number>.
     */
    async updateCommand(): Promise<number> {
        const xtermParser = XtermParser.getInstance();
        const command = await xtermParser.parseTerminalBuffer(this.commandBuffer, true);
        console.log("su : ", command);
        const commandId = await Command.create(this.sessionId, command || '', '', '', 0);
        await Command.updateEnd(commandId, new Date());
        this.commandId = commandId;
        return commandId;
    }

    /**
     * Handles detected `su` commands by updating the command table and retrieving the terminal data buffer.
     * @returns A Promise resolving to true if an `su` command is handled, otherwise false.
     */
    async handleSuCommand():Promise<boolean> {
        if (await this.detectSuCommand()) {
            await this.updateCommand();
            TerminalSessionManager.retrieveDataBuffer(this.terminal);
            return true;
        }
        return false;
    }
}
