import * as assert from 'assert';
import { Util } from '../../util';

suite('Util Test Suite', () => {

    test('Should clean delete sequences correctly', () => {
        const input = 'ls -ltr\b\u001B[K\b\u001B[Kr'; // 'ls -ltr\b\u001B[K\b\u001B[Kr' should become 'ls -tr'
        const expectedOutput = 'ls -lr';
        const actualOutput = Util.cleanDeleteSequenceString(input);
        assert.strictEqual(actualOutput, expectedOutput);
    });

    test('Should return the same string if no delete sequences', () => {
        const input = 'echo hello';
        const expectedOutput = 'echo hello';
        const actualOutput = Util.cleanDeleteSequenceString(input);
        assert.strictEqual(actualOutput, expectedOutput);
    });

    test('Should handle backspaces correctly', () => {
        const input = 'hello\b\b\bworld'; // 'hello\b\b\bworld' should become 'heworld'
        const expectedOutput = 'heworld';
        const actualOutput = Util.cleanDeleteSequenceString(input);
        assert.strictEqual(actualOutput, expectedOutput);
    });

    test('Should return empty string for input with only delete sequences', () => {
        const input = '\b\b\b\u001B[K\u001B[K';
        const expectedOutput = '';
        const actualOutput = Util.cleanDeleteSequenceString(input);
        assert.strictEqual(actualOutput, expectedOutput);
    });

    test('should return the file name for vi command', () => {
        const result = Util.checkFileNameFromEditorCommand('vi myfile.txt');
        assert.strictEqual(result, 'myfile.txt');
    });

    test('should return the file name for emacs command', () => {
        const result = Util.checkFileNameFromEditorCommand('emacs script.sh');
        assert.strictEqual(result, 'script.sh');
    });

    test('should return undefined for non-editor commands', () => {
        const result = Util.checkFileNameFromEditorCommand('ls -al');
        assert.strictEqual(result, undefined);
    });

    test('should return undefined if no file name is provided', () => {
        const result = Util.checkFileNameFromEditorCommand('vi');
        assert.strictEqual(result, undefined);
    });

    test('should handle extra spaces', () => {
        const result = Util.checkFileNameFromEditorCommand('  nano   notes.txt  ');
        assert.strictEqual(result, 'notes.txt');
    });
});
