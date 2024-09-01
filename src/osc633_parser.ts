import * as vscode from 'vscode';
import { Logger } from './logger';
import { Util } from './util';

export class ParsedCommand {
    command = '';
    output = '';
    exitCode: number | null = null;
    cwd = '';
}

export class OSC633Parser {
    private static extractOutputOfOSC633B(output: string): string {
        // Split the output by the OSC 633;B sequence
        const parts = output.split('\u0007\u001B]633;B\u0007');
        if (parts.length < 2) {return ''; }
        
        // The relevant part is after the OSC 633;B sequence
        let result = parts[1].trim();
        
        // Remove the prompt if it exists
        const promptPattern = /\[\w+@\w+.*?\$\s*$/;
        result = result.replace(promptPattern, '').trim();
        
        // Return the cleaned-up result
        return result.length > 0 ? result : '';
    }

    // OSC 633 を解析する関数。onDidWriteTerminalData でバッファリングしたデータを解析する
    static parseOSC633Simple(input: string) : ParsedCommand {
        const parsedCommand = new ParsedCommand();
        // Split the input by OSC 633 sequences
        const parts = input.split(/\u001b\]633;/);

        if (parts.length > 0) { 
            parsedCommand.command = Util.cleanDeleteSequenceString(parts[0].trim());
        };
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (part.startsWith('D;')) {
                // Extract the exit code from the sequence starting with 'D;'
                parsedCommand.exitCode = parseInt(part.slice(2).trim(), 10);
            } else if (part.startsWith('C')) {
                // Extract the output which is between 'C' and next sequence.
                parsedCommand.output = parts[i].replace(/^C\u0007\n/, '').trim();
            } else if (part.startsWith('P;Cwd=')) {
                // Extract the working directory from the sequence starting with 'P;Cwd='
                // parsedCommand.cwd = part.slice(6).trim();
                let cwd = part.slice(6);
                cwd = cwd.replace(/\x07/g, ''); 
                parsedCommand.cwd = cwd.trim();
            }
        }
        console.log("COMMAND OUTPUT:" , parsedCommand.output);
        if (parsedCommand.output === 'C\u0007') { 
            console.log("PARSE OSC633B");
            parsedCommand.output = this.extractOutputOfOSC633B(input);
        }
        return parsedCommand;
    }

}
