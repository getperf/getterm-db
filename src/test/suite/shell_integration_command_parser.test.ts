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

        const result = await ShellIntegrationCommandParser.parse(input);
        assert.strictEqual(result.command, 'sleep 1 | echo hello');
        assert.strictEqual(result.output, 'hello');
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.cwd, '/home/psadmin');
    });
    
    test('multiline1', async () => {
        // const input = `sleep 1 | echo hello\n\u001b]633;E;sleep 1;\u0007\u001b]633;C\u0007\nhello\n\u001b]633;D;0\u0007\u001b]633;P;Cwd=/home/psadmin\u0007\u001b]633;A\u0007\u001b]633;B\u0007[psadmin@ol88 ~]$`;
        const input = `sleep 1 \
\u001b]633;F\u0007> \u001b]633;G\u0007| ls \
\u001b]633;F\u0007> \u001b]633;G\u0007| wc 
\u001b]633;E;sleep 1;\u0007\u001b]633;C\u0007    146     146    2061
\u001b]633;D;0\u0007\u001b]633;P;Cwd=/home/psadmin\u0007\u001b]633;A\u0007[psadmin@alma8 ~]$ \u001b]633;B\u0007`;

        const result = await ShellIntegrationCommandParser.parse(input);
        assert.strictEqual(result.command, 'sleep 1 \\n| ls \\n| wc');
        assert.strictEqual(result.output, '    146     146    2061\n');
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.cwd, '/home/psadmin');
    });
});
