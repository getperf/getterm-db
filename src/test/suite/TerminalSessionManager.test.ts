import * as assert from 'assert';
import * as vscode from 'vscode';
import { TerminalSessionManager } from '../../TerminalSessionManager';
import { XtermParser } from '../../XtermParser';
import { DatabaseManager } from '../../DatabaseManager';

suite('NewTerminalSessionManager Tests', () => {

    let mockTerminal: vscode.Terminal;

    setup(async () => {
        mockTerminal = { name: 'Test Terminal' } as vscode.Terminal;
        await DatabaseManager.initialize();
    });

    test('should set and retrieve session data for a terminal', async () => {
        const sessionId = 1;
        const commandId = 101;
        const dataBuffer = 'output line 1\noutput line 2';

        // Create session
        const session = await TerminalSessionManager.create(mockTerminal);
        TerminalSessionManager.updateSession(mockTerminal, 'sessionId', sessionId);
        TerminalSessionManager.updateSession(mockTerminal, 'commandId', commandId);
        TerminalSessionManager.pushDataBuffer(mockTerminal, dataBuffer);

        // Validate session data
        assert.strictEqual(TerminalSessionManager.getSessionId(mockTerminal), sessionId);
        assert.strictEqual(TerminalSessionManager.retrieveDataBuffer(mockTerminal), dataBuffer);
    });

    test('should update session data for an existing terminal', async () => {
        const sessionId1 = 1;
        const sessionId2 = 2;
        const dataBuffer1 = 'output line 1';
        const dataBuffer2 = 'output line 2';

        // Create session
        await TerminalSessionManager.create(mockTerminal);
        TerminalSessionManager.updateSession(mockTerminal, 'sessionId', sessionId1);
        TerminalSessionManager.pushDataBuffer(mockTerminal, dataBuffer1);

        // Update session
        TerminalSessionManager.updateSession(mockTerminal, 'sessionId', sessionId2);
        TerminalSessionManager.pushDataBuffer(mockTerminal, dataBuffer2);

        // Validate updated session data
        assert.strictEqual(TerminalSessionManager.getSessionId(mockTerminal), sessionId2);
        assert.strictEqual(TerminalSessionManager.retrieveDataBuffer(mockTerminal), dataBuffer1+dataBuffer2);
    });

    test('should throw an error when retrieving a session for a non-existent terminal', () => {
        assert.throws(() => {
            TerminalSessionManager.getSessionId(mockTerminal);
        }, /No session found/);
    });

    test('should handle data buffer appending and retrieval correctly', async () => {
        const dataBuffer1 = 'output line 1';
        const dataBuffer2 = 'output line 2';

        // Create session and append data
        await TerminalSessionManager.create(mockTerminal);
        TerminalSessionManager.pushDataBuffer(mockTerminal, dataBuffer1);
        TerminalSessionManager.pushDataBuffer(mockTerminal, dataBuffer2);

        // Retrieve and validate data buffer
        const buffer = TerminalSessionManager.retrieveDataBuffer(mockTerminal);
        assert.strictEqual(buffer, dataBuffer1 + dataBuffer2);
    });

    test('should set and get XtermParser correctly', async () => {
        const xtermParser = XtermParser.getInstance();

        // Create session and set XtermParser
        await TerminalSessionManager.create(mockTerminal);
        TerminalSessionManager.updateSession(mockTerminal, 'xtermParser', xtermParser);

        // Validate XtermParser
        const result = TerminalSessionManager.getSession(mockTerminal).xtermParser;
        assert.strictEqual(result, xtermParser);
    });
});
  