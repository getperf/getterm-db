import * as assert from 'assert';
import { Util } from '../../util';
import { ParsedCommand, ShellIntegrationCommandParser } from '../../shell_integration_command_parser';

suite('Util Test Suite', () => {

    test('should correctly parse a buffer with a multiline command', async () => {
        const input = `sleep 1 \
\u001b]633;F\u0007> \u001b]633;G\u0007| ls \
\u001b]633;F\u0007> \u001b]633;G\u0007| wc 
\u001b]633;E;sleep 1;\u0007\u001b]633;C\u0007    146     146    2061
\u001b]633;D;0\u0007\u001b]633;P;Cwd=/home/psadmin\u0007\u001b]633;A\u0007[psadmin@alma8 ~]$ \u001b]633;B\u0007`;

        const result = await ShellIntegrationCommandParser.parse(input);
        console.log("RESU:", result);
        assert.strictEqual(result.command.replace(/\\\n/g, ""), 'sleep 1 | ls | wc');
        assert.strictEqual(result.output, '    146     146    2061\n');
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.cwd, '/home/psadmin');
    });

    test('should correctly parse a command sleep 1; echo hello', async () => {
        const input = `\u001b]633;A\u0007[psadmin@ol88 ~]$ \u001b]633;B\u0007sleep 1; echo hello\r\n\u001b]633;E;sleep 1;\u0007\u001b]633;C\u0007hello\r\n\u001b]633;D;0\u0007\u001b]633;P;Cwd=/home/psadmin\u0007\u001b]633;A\u0007[psadmin@ol88 ~]$ \u001b]633;B\u0007`;

        const result = await ShellIntegrationCommandParser.parse(input);
        assert.strictEqual(result.command, 'sleep 1; echo hello');
        assert.strictEqual(result.output, 'hello\n');
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.cwd, '/home/psadmin');
    });

    test('should correctly parse a command sleep 1 | echo "hello \\\nworld"', async () => {
        const input = `[psadmin@ol88 ~]$ source \"/tmp/vscode-shell-integration.sh\"\r\n\u001b]0;psadmin@ol88:~\u0007\u001b]633;A\u0007[psadmin@ol88 ~]$ \u001b]633;B\u0007sleep 1 | echo \"hello \\\r\n\u001b]633;F\u0007> \u001b]633;G\u0007world\"\r\n\u001b]633;E;sleep 1;\u0007\u001b]633;C\u0007hello world\r\n\u001b]633;D;0\u0007\u001b]633;P;Cwd=/home/psadmin\u0007\u001b]633;A\u0007[psadmin@ol88 ~]$ \u001b]633;B\u0007`;

        const result = await ShellIntegrationCommandParser.parse(input);
        console.log(JSON.stringify(result));
        assert.strictEqual(result.command, 'sleep 1 | echo "hello \\\nworld"');
        assert.strictEqual(result.output, 'hello world\n');
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.cwd, '/home/psadmin');
    });

    test('should correctly parse a command sleep1 | ls | wc with ctrl-u', async () => {
        const input = `ls -l\u001b[?25l\u001b[12;19H\u001b[K\u001b[?25hsleep 1 | ls \\\r\n\u001b]633;F\u0007> \u001b]633;G\u0007| wc\r\n\u001b]633;E;sleep 1;\u0007\u001b]633;C\u0007      7       7      85\r\n\u001b]633;D;0\u0007\u001b]633;P;Cwd=/home/psadmin\u0007\u001b]633;A\u0007[psadmin@ol88 ~]$ \u001b]633;B\u0007`;

        const result = await ShellIntegrationCommandParser.parse(input);
        console.log(JSON.stringify(result));
        assert.strictEqual(result.command, 'sleep 1 | ls \\\n| wc');
        assert.strictEqual(result.output, '      7       7      85\n');
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.cwd, '/home/psadmin');
    });

    test('should correctly parse a command output including empty row', async () => {
        // const input = "cat /tmp/01.txt\r\n\u001b]633;E;cat /tmp/01.txt;\u0007hello\r\n\nworld\r\n\u001b]633;D;0\u0007\u001b]633;P;Cwd=/home/psadmin\u0007\u001b]633;A\u0007[psadmin@ol88 ~]$ \u001b]633;B\u0007";
        const input = "cat /tmp/01.txt\r\n\u001b]633;E;cat /tmp/01.txt;\u0007\u001b]633;C\u0007hello\r\n\nworld\r\n\u001b]633;D;0\u0007\u001b]633;P;Cwd=/home/psadmin\u0007\u001b]633;A\u0007[psadmin@ol88 ~]$ \u001b]633;B\u0007";

        const result = await ShellIntegrationCommandParser.parse(input);
        console.log(JSON.stringify(result));
        assert.strictEqual(result.command, 'cat /tmp/01.txt');
        assert.strictEqual(result.output, 'hello\n\nworld\n');
        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(result.cwd, '/home/psadmin');
    });
});
