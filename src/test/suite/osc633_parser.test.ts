import * as assert from 'assert';
import { OSC633Parser, ParsedCommand } from '../../osc633_parser';

suite('OSC633Parser Tests', () => {

    test('Parse Simple OSC 633 Sequence', () => {
        const input = `pwd\u001B]633;E;pwd;\u0007\u001B]633;C\u0007\u001B]633;D;0\u0007\u001B]633;P;Cwd=/home/\u0007\u001B]633;A\u0007\u001B]633;B\u0007\n/home/psadmin\n[psadmin@ol810 ~]$`;
        const expectedOutput = '/home/psadmin';
        const expectedCommand = 'pwd';
        const expectedExitCode = 0;
        const expectedCwd = '/home/';

        const parsed = OSC633Parser.parseOSC633Simple(input);
        assert.strictEqual(parsed.command, expectedCommand, 'Command should be "pwd"');
        assert.strictEqual(parsed.output, expectedOutput, `Output should be "${expectedOutput}"`);
        assert.strictEqual(parsed.exitCode, expectedExitCode, `Exit code should be ${expectedExitCode}`);
        assert.strictEqual(parsed.cwd, expectedCwd, `CWD should be "${expectedCwd}"`);
    });

    test('Handle Empty or Incomplete Input', () => {
        const input = '';
        const parsed = OSC633Parser.parseOSC633Simple(input);
        
        assert.strictEqual(parsed.command, '', 'Command should be empty');
        assert.strictEqual(parsed.output, '', 'Output should be empty');
        assert.strictEqual(parsed.exitCode, null, 'Exit code should be null');
        assert.strictEqual(parsed.cwd, '', 'CWD should be empty');
    });

    test('Handle OSC 633 B with Additional Text', () => {
        const input = `some command\u001B]633;E;some command\u0007\u001B]633;C\u0007\u001B]633;D;0\u0007\u001B]633;P;Cwd=/some/dir\u0007\u001B]633;A\u0007\u001B]633;B\u0007output text\n[some@host ~]$`;
        const expectedOutput = 'output text';
        const parsed = OSC633Parser.parseOSC633Simple(input);

        assert.strictEqual(parsed.output, expectedOutput, `Output should be "${expectedOutput}"`);
    });

    test('Handle Missing Output', () => {
        const input = `ls\u001B]633;E;ls;\u0007\u001B]633;C\u0007\u001B]633;D;1\u0007\u001B]633;P;Cwd=/home/user\u0007\u001B]633;A\u0007\u001B]633;B\u0007\n[psadmin@ol810 ~]$`;
        const expectedCommand = 'ls';
        const expectedExitCode = 1;
        const expectedCwd = '/home/user';
        const parsed = OSC633Parser.parseOSC633Simple(input);

        assert.strictEqual(parsed.command, expectedCommand, 'Command should be "ls"');
        assert.strictEqual(parsed.output, '', 'Output should be empty');
        assert.strictEqual(parsed.exitCode, expectedExitCode, `Exit code should be ${expectedExitCode}`);
        assert.strictEqual(parsed.cwd, expectedCwd, `CWD should be "${expectedCwd}"`);
    });

    test('Handle Filter OSC Sequence Header', () => {
        const input = `\u001B]633;A\u0007\u001B]633;B\u0007(base) [psadmin@ol89 ~]$ pwd`;
        const expected = `(base) [psadmin@ol89 ~]$ pwd`;
        const parsed = OSC633Parser.filterOSCSequenceHeader(input);
        assert.strictEqual(parsed, expected, 'Command should be first');
    });

    test('should remove everything before "$ "', () => {
        const input = '(base) [psadmin@ol89 ~]$ pwd\n';
        const expected = 'pwd\n';
        const result = OSC633Parser.cleanCommandLines(input);
        assert.strictEqual(result, expected);
    });

    test('should handle echo with special characters correctly', () => {
        const input = '(base) [psadmin@ol89 ~]$ echo "\u0008\u001b[K-e "hello $ world"\n';
        const expected = 'echo "\u0008\u001b[K-e "hello $ world"\n';
         const result = OSC633Parser.cleanCommandLines(input);
        assert.strictEqual(result, expected);
    });

});
