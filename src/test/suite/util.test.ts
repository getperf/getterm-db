import * as assert from "assert";
import { Util } from "../../Util";

suite("Util Test Suite", () => {
    test("formats date with milliseconds correctly", () => {
        const date = new Date("2023-10-12T15:30:45.123");
        const formattedDate = Util.formatDateWithMilliseconds(date);
        assert.strictEqual(formattedDate, "2023-10-12 15:30:45.123");
    });

    test("Should clean delete sequences correctly", () => {
        const input = "ls -ltr\b\u001B[K\b\u001B[Kr"; // 'ls -ltr\b\u001B[K\b\u001B[Kr' should become 'ls -tr'
        const expectedOutput = "ls -lr";
        const actualOutput = Util.cleanDeleteSequenceString(input);
        assert.strictEqual(actualOutput, expectedOutput);
    });

    test("Should return the same string if no delete sequences", () => {
        const input = "echo hello";
        const expectedOutput = "echo hello";
        const actualOutput = Util.cleanDeleteSequenceString(input);
        assert.strictEqual(actualOutput, expectedOutput);
    });

    test("Should handle backspaces correctly", () => {
        const input = "hello\b\b\bworld"; // 'hello\b\b\bworld' should become 'heworld'
        const expectedOutput = "heworld";
        const actualOutput = Util.cleanDeleteSequenceString(input);
        assert.strictEqual(actualOutput, expectedOutput);
    });

    test("Should return empty string for input with only delete sequences", () => {
        const input = "\b\b\b\u001B[K\u001B[K";
        const expectedOutput = "";
        const actualOutput = Util.cleanDeleteSequenceString(input);
        assert.strictEqual(actualOutput, expectedOutput);
    });

    test("extractCommandAfterLastPrompt should return command after last prompt", () => {
        const input = `
            user@host$ echo Hello
            user@host$ ls -l`;
        assert.strictEqual(Util.extractCommandAfterLastPrompt(input), "ls -l");
    });

    test("removeBackslashNewline should remove backslash-newline sequences", () => {
        const input = "echo Hello \\\n> World";
        assert.strictEqual(
            Util.removeBackslashNewline(input),
            "echo Hello World",
        );
    });

    test("removeLeadingLineWithWhitespace should remove line before 20+ whitespace", () => {
        const input = `ignoreThisLine
                         actual command`;
        assert.strictEqual(
            Util.removeLeadingLineWithWhitespace(input),
            "actual command",
        );
    });

    test('removeLeadingLineWithWhitespace should remove the "su -" + ctrl-u line', () => {
        const input = `su - 
                   sudo su -`;
        assert.strictEqual(
            Util.removeLeadingLineWithWhitespace(input),
            "sudo su -",
        );
    });

    test("extractCommandByStartEvent should return cleaned command", () => {
        const input = `
            ignoreThisLine
            user@host$ actual command`;
        assert.strictEqual(
            Util.extractCommandByStartEvent(input),
            "actual command",
        );
    });

    test("removes the last line if it is a prompt", () => {
        const input = `result1
result2
[psadmin@ol810 getperf]$ `;
        const expected = `result1
result2`;
        assert.strictEqual(Util.removePromptLine(input), expected);
    });

    // test('should return the file name for vi command', () => {
    //     const result = Util.checkFileNameFromEditorCommand('vi myfile.txt');
    //     assert.strictEqual(result, 'myfile.txt');
    // });

    // test('should return the file name for emacs command', () => {
    //     const result = Util.checkFileNameFromEditorCommand('emacs script.sh');
    //     assert.strictEqual(result, 'script.sh');
    // });

    // test('should return undefined for non-editor commands', () => {
    //     const result = Util.checkFileNameFromEditorCommand('ls -al');
    //     assert.strictEqual(result, undefined);
    // });

    // test('should return undefined if no file name is provided', () => {
    //     const result = Util.checkFileNameFromEditorCommand('vi');
    //     assert.strictEqual(result, undefined);
    // });

    // test('should handle extra spaces', () => {
    //     const result = Util.checkFileNameFromEditorCommand('  nano   notes.txt  ');
    //     assert.strictEqual(result, 'notes.txt');
    // });
});
