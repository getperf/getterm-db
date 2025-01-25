import * as assert from "assert";
import * as vscode from "vscode";
import { TerminalSessionManager } from "../../TerminalSessionManager";
import { XtermParser } from "../../XtermParser";
import { DatabaseManager } from "../../DatabaseManager";

suite("XtermParser Tests", () => {
    let parser: XtermParser;

    suiteSetup(() => {
        parser = XtermParser.getInstance();
    });

    test("parseTerminalBuffer with default options", async () => {
        const buffer = "Line 1\n\rLine 2\n\r\n\rLine 3\n\r";
        const result = await parser.parseTerminalBuffer(buffer);
        assert.strictEqual(result, "Line 1\nLine 2\nLine 3\n");
    });

    test("parseTerminalBuffer with trimEmptyRow = false", async () => {
        const buffer = "Line 1\nLine 2\n\nLine 3\n";
        const options = { trimEmptyRow: false };
        const result = await parser.parseTerminalBuffer(buffer, options);
        assert.strictEqual(result, "Line 1\nLine 2\n\nLine 3\n");
    });

    test("parseTerminalBuffer with delay", async () => {
        const buffer = "Line 1\nLine 2\n";
        const options = { delay: 100 }; // 長めの遅延を設定
        const start = Date.now();
        const result = await parser.parseTerminalBuffer(buffer, options);
        const elapsed = Date.now() - start;

        // 遅延が発生していることを確認
        assert.ok(elapsed >= 100);
        assert.strictEqual(result, "Line 1\nLine 2\n");
    });

});
