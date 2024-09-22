import * as assert from 'assert';
import { OSC633Parser, ParsedCommand } from '../../osc633_parser';

suite('OSC633Parser Tests', () => {

    test('Parse Simple OSC 633 Sequence', () => {
        const input = `pwd\u001B]633;E;pwd;\u0007\u001B]633;C\u0007\u001B]633;D;0\u0007\u001B]633;P;Cwd=/home/\u0007\u001B]633;A\u0007\u001B]633;B\u0007\n/home/psadmin\n[psadmin@ol810 ~]$`;
        const expectedOutput = '/home/psadmin';
        const expectedCommand = 'pwd';
        const expectedExitCode = 0;
        const expectedCwd = '/home/';

        const parsed = OSC633Parser.parseOSC633AndCommand(input);

        assert.notEqual(parsed, null);
        assert.strictEqual(parsed?.command, expectedCommand, 'Command should be "pwd"');
        assert.strictEqual(parsed?.output, expectedOutput, `Output should be "${expectedOutput}"`);
        assert.strictEqual(parsed?.exitCode, expectedExitCode, `Exit code should be ${expectedExitCode}`);
        assert.strictEqual(parsed?.cwd, expectedCwd, `CWD should be "${expectedCwd}"`);
    });

    test('Handle Empty or Incomplete Input', () => {
        const input = '';
        const parsed = OSC633Parser.parseOSC633AndCommand(input);

        assert.equal(parsed, null);
    });

    test('Handle OSC 633 B with Additional Text', () => {
        const input = `some command\u001B]633;E;some command\u0007\u001B]633;C\u0007\u001B]633;D;0\u0007\u001B]633;P;Cwd=/some/dir\u0007\u001B]633;A\u0007\u001B]633;B\u0007output text\n[some@host ~]$`;
        const expectedOutput = 'output text';
        const parsed = OSC633Parser.parseOSC633AndCommand(input);

        assert.notEqual(parsed, null);
        assert.strictEqual(parsed?.output, expectedOutput, `Output should be "${expectedOutput}"`);
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
        const result = OSC633Parser.cleaningMultiLineCommands(input);
        assert.strictEqual(result, expected);
    });

    test('should handle echo with special characters correctly', () => {
        const input = '(base) [psadmin@ol89 ~]$ echo "\u0008\u001b[K-e "hello $ world"\n';
        const expected = 'echo "\u0008\u001b[K-e "hello $ world"\n';
         const result = OSC633Parser.cleaningMultiLineCommands(input);
        assert.strictEqual(result, expected);
    });

});
