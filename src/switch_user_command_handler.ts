import * as vscode from 'vscode';
import { Command } from "./model/commands";
import { XtermParser } from './xterm_parser';
import { CommandHandler } from './command_handler';

export class SwitchUserCommandHandler {
    private commandHandler: CommandHandler;
    private commandBuffer: string;
    private sessionId: number;

    constructor(commandHandler: CommandHandler, session_id: number, commandBuffer: string) {
        this.commandHandler = commandHandler;
        this.sessionId = session_id;
        this.commandBuffer = commandBuffer;
    }

    // su コマンドの検知
    // 簡易的なエスケープシーケンス処理の解析のため、以下パターンでは検知できない
    // ctrl-u で全行クリアしてから、 su - する場合。
    detectSuCommand(): boolean {
        // テキストから su コマンドを検知するため、エスケープシーケンスを空白に変換
        const commandText = this.commandBuffer
            .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, ' ')
            .replace(/\s+/g, ' ').trim();
        console.log("COMMANDTEXT:", commandText);
        const commandParts = commandText.trim().split(/\s+/);
        console.log("COMMANDPARTS:", commandParts);
        if (commandParts.includes('su')) {
            console.log("Detected 'su' command.");
            return true;
        }
        return false;
    }

    async updateCommand(): Promise<number> {
        const xtermParser = XtermParser.getInstance();
        const command = await xtermParser.parseTerminalBuffer(this.commandBuffer);
        console.log("su : ", command);
        const commandId = await Command.create(this.sessionId, command || '', '', '', 0);
        await Command.updateEnd(commandId, new Date());
        return commandId;
    }

}
