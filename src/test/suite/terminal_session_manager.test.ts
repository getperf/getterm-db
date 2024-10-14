import * as assert from 'assert';
import * as vscode from 'vscode';
import { TerminalSessionManager } from '../../terminal_session_manager';
import { XtermParser } from '../../xterm_parser';
import { MockOutputChannel } from './logger.test';
import { Logger, LogLevel } from '../../logger';
// import { EditedFileDownloader } from '../../edited_file_downloader';
import { ParsedCommand } from '../../osc633_parser';

suite('TerminalSessionManager Tests', () => {

  test('Set and retrieve session data for a terminal', () => {
    const terminal = vscode.window.createTerminal('Test Terminal');
    const sessionId = 1;
    const commandId = 101;
    const dataBuffer = ['output line 1', 'output line 2'];

    // Set session data
    TerminalSessionManager.setSessionId(terminal, sessionId);
    TerminalSessionManager.setCommandId(terminal, commandId);
    const session = TerminalSessionManager.setDataBuffer(terminal, dataBuffer);

    // Validate the session data
    assert.ok(session, 'Session should exist for the terminal');
    assert.strictEqual(session?.sessionId, sessionId, 'Session ID should match');
    assert.strictEqual(session?.commandId, commandId, 'Command ID should match');
    assert.deepStrictEqual(session?.consoleBuffer, dataBuffer, 'Data buffer should match');

    assert.strictEqual(TerminalSessionManager.getSessionId(terminal), sessionId, 'Session ID should match');
    assert.strictEqual(TerminalSessionManager.getCommandId(terminal), commandId, 'Command ID should match');
    assert.strictEqual(TerminalSessionManager.getDataBuffer(terminal), dataBuffer, 'Data buffer should match');
  });

  test('Update session data for an existing terminal', () => {
    const terminal = vscode.window.createTerminal('Test Terminal');
    const sessionId1 = 1;
    const commandId1 = 101;
    const dataBuffer1 = ['output line 1'];

    const sessionId2 = 2;
    const commandId2 = 102;
    const dataBuffer2 = ['output line 2'];

    // Set initial session data
    TerminalSessionManager.setSessionId(terminal, sessionId1);
    TerminalSessionManager.setCommandId(terminal, commandId1);
    TerminalSessionManager.setDataBuffer(terminal, dataBuffer1);

    // Update session data
    TerminalSessionManager.setSessionId(terminal, sessionId2);
    TerminalSessionManager.setCommandId(terminal, commandId2);
    const session = TerminalSessionManager.setDataBuffer(terminal, dataBuffer2);

    // Validate the updated session data
    assert.ok(session, 'Session should exist for the terminal');
    assert.strictEqual(session?.sessionId, sessionId2, 'Updated session ID should match');
    assert.strictEqual(session?.commandId, commandId2, 'Updated command ID should match');
    assert.deepStrictEqual(session?.consoleBuffer, dataBuffer2, 'Updated data buffer should match');
  });

  test('Create a new session if no existing session is found', () => {
    const terminal = vscode.window.createTerminal('New Terminal');
    const sessionId = 3;
    const commandId = 103;
    const dataBuffer = ['output line 3'];

    // Set session data for a new terminal
    TerminalSessionManager.setSessionId(terminal, sessionId);
    TerminalSessionManager.setCommandId(terminal, commandId);
    TerminalSessionManager.setDataBuffer(terminal, dataBuffer);

    // Retrieve the session data
    const session = TerminalSessionManager.get(terminal);

    // Validate the session data
    assert.ok(session, 'Session should exist for the new terminal');
    assert.strictEqual(session?.sessionId, sessionId, 'Session ID should match');
    assert.strictEqual(session?.commandId, commandId, 'Command ID should match');
    assert.deepStrictEqual(session?.consoleBuffer, dataBuffer, 'Data buffer should match');
  });

  test('Create a new session id if no existing session is found', () => {
      const terminal = vscode.window.createTerminal('New Terminal');
      const sessionId = 3;
  
      // Set session data for a new terminal
      TerminalSessionManager.setSessionId(terminal, sessionId);
  
      // Retrieve the session data
      const session = TerminalSessionManager.get(terminal);
  
      // Validate the session data
      assert.ok(session, 'Session should exist for the new terminal');
      assert.strictEqual(session?.sessionId, sessionId, 'Session ID should match');
  });

  test('Push and retreive session data buffer', () => {
    const terminal = vscode.window.createTerminal('Test Terminal');
    const dataBuffer1 = 'output line 1output line 2';
    const dataBuffer2 = 'output line 3';

    const line0 = TerminalSessionManager.retrieveDataBuffer(terminal);
    assert.strictEqual(line0, '', 'data buffer should match');

    // Set initial session data
    TerminalSessionManager.pushDataBuffer(terminal, 'output line 1');
    TerminalSessionManager.pushDataBuffer(terminal, 'output line 2');
    const line1 = TerminalSessionManager.retrieveDataBuffer(terminal);
    assert.strictEqual(line1, dataBuffer1, 'data buffer should match');

    // Update session data
    TerminalSessionManager.pushDataBuffer(terminal, 'output line 3');
    const line2 = TerminalSessionManager.retrieveDataBuffer(terminal);
    assert.strictEqual(line2, dataBuffer2, 'data buffer should match');
  });
      
  test('should set and get xtermParser correctly', () => {
    const terminal = <vscode.Terminal>{};
    const xtermParser = XtermParser.getInstance();

    TerminalSessionManager.setXtermParser(terminal, xtermParser);
    const result = TerminalSessionManager.getXtermParser(terminal);
    assert.strictEqual(result, xtermParser, 'XtermParser should be set correctly');
  });

  // test('should set and get editedFileDownloader correctly', () => {
  //   const terminal = <vscode.Terminal>{};
  //   const parsedCommand = new ParsedCommand();
  //   const editedFileDownloader = new EditedFileDownloader(terminal, parsedCommand);

  //   TerminalSessionManager.setEditedFileDownloader(terminal, editedFileDownloader);
  //   const result = TerminalSessionManager.getEditedFileDownloader(terminal);
  //   assert.strictEqual(result, editedFileDownloader, 'EditedFileDownloader should be set correctly');
  // });

  // test('should set and get updatingFlag correctly', () => {
  //   const terminal = <vscode.Terminal>{};

  //   TerminalSessionManager.setUpdatingFlag(terminal, true);
  //   const result = TerminalSessionManager.getUpdatingFlag(terminal);
  //   assert.strictEqual(result, true, 'UpdatingFlag should be true');
  // });

  // test('should set and get updateFilePath correctly', () => {
  //   const terminal = <vscode.Terminal>{};
  //   const filePath = '/path/to/file';

  //   TerminalSessionManager.setUpdateFilePath(terminal, filePath);
  //   const result = TerminalSessionManager.getUpdateFilePath(terminal);
  //   assert.strictEqual(result, filePath, 'UpdateFilePath should be set correctly');
  // });

  // test('should return undefined or default values for non-existent terminal sessions', () => {
  //   const terminal = <vscode.Terminal>{};

  //   // Get values from a terminal with no session
  //   const xtermParser = TerminalSessionManager.getXtermParser(terminal);
  //   const editedFileDownloader = TerminalSessionManager.getEditedFileDownloader(terminal);

  //   // Assert that values are undefined or default values
  //   assert.strictEqual(xtermParser, undefined, 'XtermParser should be undefined');
  //   assert.strictEqual(editedFileDownloader, undefined, 'EditedFileDownloader should be undefined');
  // });
});
  