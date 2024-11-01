import * as vscode from 'vscode';
import { Command } from "./model/commands";
import { XtermParser } from './xterm_parser';
import { TerminalSessionManager } from './terminal_session_manager';

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
     * Detects the presence of an `su` command within the command buffer.
     * Note: If the entire line is cleared using Ctrl-U before issuing `su -`, this method will not detect it
     * due to simplified escape sequence handling.
     * @returns true if `su` command is detected, otherwise false.
     */
    detectSuCommand(): boolean {
        // Replaces escape sequences with spaces to detect the `su` command in plain text
        const commandText = this.commandBuffer
            .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, ' ')
            .replace(/\s+/g, ' ').trim();
        const commandParts = commandText.trim().split(/\s+/);
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
        const command = await xtermParser.parseTerminalBuffer(this.commandBuffer);
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
        if (this.detectSuCommand()) {
            await this.updateCommand();
            TerminalSessionManager.retrieveDataBuffer(this.terminal);
            return true;
        }
        return false;
    }
}
