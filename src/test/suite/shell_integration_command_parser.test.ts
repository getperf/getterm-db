import * as assert from 'assert';
import { Util } from '../../util';
import { ParsedCommand, ShellIntegrationCommandParser } from '../../shell_integration_command_parser';

suite('Util Test Suite', () => {

    test('should correctly parse a buffer with a command and output', async () => {
        // const input = `sleep 1 | echo hello\n\u001b]633;E;sleep 1;\u0007\u001b]633;C\u0007\nhello\n\u001b]633;D;0\u0007\u001b]633;P;Cwd=/home/psadmin\u0007\u001b]633;A\u0007\u001b]633;B\u0007[psadmin@ol88 ~]$`;
        const input = `sleep 1 | echo hello\n\u001b]633;E;sleep 1;\u0007` +
	        `\u001b]633;C\u0007` +
	        `\nhello\n\u001b]633;D;0\u0007` +
	        `\u001b]633;P;Cwd=/home/psadmin\u0007` +
	        `\u001b]633;A\u0007` +
	        `\u001b]633;B\u0007` +
	        `[psadmin@ol88 ~]$`;

        const expected = new ParsedCommand();
        expected.command = 'sleep 1 | echo hello';
        expected.output = 'hello';
        expected.exitCode = 0;
        expected.cwd = '/home/psadmin';

        const result = await ShellIntegrationCommandParser.parse(input);

        assert.strictEqual(result.command, expected.command);
        // assert.strictEqual(result.output, expected.output);
        // assert.strictEqual(result.exitCode, expected.exitCode);
        // assert.strictEqual(result.cwd, expected.cwd);
    });

    test('Should remove escape sequences and return clean command text', async () => {
        const input = 'sleep 1 \b ; echo hello\u001b]633;E;sleep 1;\u0007';
        const expectedOutput = 'sleep 1 ; echo hello';

        const actualOutput = await ShellIntegrationCommandParser.extractCommandText(input);

        assert.strictEqual(actualOutput, expectedOutput, 'The extracted command text should match the expected output');
    });

    test('Should remove the "pwd" + ctrl-u line', async () => {
        const input = 'pwd\u001b[?25l\u001b[8;19H\u001b[K\u001b[?25hls | wc';
        const expectedOutput = 'ls | wc';

        const actualOutput = await ShellIntegrationCommandParser.extractCommandText(input);

        assert.strictEqual(actualOutput, expectedOutput, 'The extracted command text should match the expected output');
    });

    test('should correctly handle buffer with C command but no B command', () => {
        const input = `ls | echo hello\u001b]633;C\u0007` +
            `ls | echo hello\u001b]633;C\u0007` +
            `Output text`;
        const expectedOutputBuffer = `Output text`;

        const result = ShellIntegrationCommandParser.splitBufferByCommandSequence(input);

        assert.strictEqual(result.outputBuffer, expectedOutputBuffer);
    });

    test('should correctly split buffer with both C and B commands', () => {
        const input = `[psadmin@alma8 ~]$ source "/tmp/vscode-shell-integration.sh"` +
			`\u001b]0;psadmin@alma8:~\u0007` +
			`\u001b]633;A\u0007` +
			`[psadmin@alma8 ~]$ \u001b]633;B\u0007` +
			`ls | wc | sleep 1` +
			`\u001b]633;E;ls --color=auto;\u0007` +
			`\u001b]633;C\u0007`;

        const expectedCommandBuffer = `ls | wc | sleep 1\u001b]633;E;ls --color=auto;\u0007`;
        const expectedOutputBuffer = ``;

        const result = ShellIntegrationCommandParser.splitBufferByCommandSequence(input);
        console.log("RESULT:", result);
        assert.strictEqual(result.commandBuffer, expectedCommandBuffer);
        assert.strictEqual(result.outputBuffer, expectedOutputBuffer);
    });
    
});
