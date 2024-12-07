export class ParsedCommand {
    command = '';
    output = '';
    exitCode: number | null = null;
    cwd = '';
}

export class ShellIntegrationCommandParser {
    static parse(buffer: string): ParsedCommand {
        const parsedCommand = new ParsedCommand();

        // Split buffer into command and output parts using C-command delimiter
        const cIndex = buffer.lastIndexOf('\u001b]633;C\u0007');
        if (cIndex === -1) {
            throw new Error('C-command not found in the buffer');
        }

        const commandBuffer = buffer.slice(0, cIndex);
        const outputBuffer = buffer.slice(cIndex + 8);

        // Extract command text from command buffer
        const eIndex = commandBuffer.lastIndexOf('\u001b]633;E;');
        if (eIndex !== -1) {
            parsedCommand.command = commandBuffer.slice(eIndex + 8).replace(/;\u0007$/, '');
        }

        // Extract output text from output buffer
        const dIndex = outputBuffer.lastIndexOf('\u001b]633;D;');
        if (dIndex !== -1) {
            const exitCodeStr = outputBuffer.slice(dIndex + 8).replace(/\u0007$/, '');
            parsedCommand.exitCode = parseInt(exitCodeStr, 10);
        }

        const cwdIndex = outputBuffer.lastIndexOf('\u001b]633;P;Cwd=');
        if (cwdIndex !== -1) {
            parsedCommand.cwd = outputBuffer.slice(cwdIndex + 13).replace(/\u0007$/, '');
        }

        // Extract actual output between C-command and other delimiters
        const aIndex = outputBuffer.lastIndexOf('\u001b]633;A\u0007');
        if (aIndex !== -1) {
            parsedCommand.output = outputBuffer.slice(0, aIndex).trim();
        }

        return parsedCommand;
    }
}
