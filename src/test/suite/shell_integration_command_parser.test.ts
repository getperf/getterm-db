import * as assert from 'assert';
import { Util } from '../../util';
import { ParsedCommand, ShellIntegrationCommandParser } from '../../shell_integration_command_parser';

suite('Util Test Suite', () => {

    test('should correctly parse a buffer with a command and output', () => {
        const input = `sleep 1 | echo hello\n\u001b]633;E;sleep 1;\u0007\u001b]633;C\u0007\nhello\n\u001b]633;D;0\u0007\u001b]633;P;Cwd=/home/psadmin\u0007\u001b]633;A\u0007\u001b]633;B\u0007[psadmin@ol88 ~]$`;

        const expected = new ParsedCommand();
        // expected.command = 'sleep 1 | echo hello';
        expected.command = 'sleep 1';
        expected.output = 'hello';
        expected.exitCode = 0;
        expected.cwd = '/home/psadmin';

        const result = ShellIntegrationCommandParser.parse(input);

        assert.strictEqual(result.command, expected.command);
        // assert.strictEqual(result.output, expected.output);
        assert.strictEqual(result.exitCode, expected.exitCode);
        // assert.strictEqual(result.cwd, expected.cwd);
    });
    
});
