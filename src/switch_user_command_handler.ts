import { Command } from "./model/commands";

export class SwitchUserCommandHandler {
    private commandText: string;
    private session_id: number;

    constructor(session_id: number, commandText: string) {
        this.session_id = session_id;
        this.commandText = commandText;
    }

    detectSuCommand(): boolean {
        const commandParts = this.commandText.trim().split(/\s+/);
        if (commandParts.includes('su')) {
            console.log("Detected 'su' command.");
            return true;
        }
        return false;
    }

    updateCommand(): void {
        Command.create(this.session_id, this.commandText, '', '', 0);
    }
}
