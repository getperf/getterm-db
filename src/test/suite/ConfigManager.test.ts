import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { ConfigManager } from '../../ConfigManager';

suite('ConfigManager Tests', function () {
    const mockContext: vscode.ExtensionContext = {
        globalState: {
            get: (key: string) => undefined,
            update: (key: string, value: any) => Promise.resolve(),
        },
        workspaceState: {
            get: (key: string) => undefined,
            update: (key: string, value: any) => Promise.resolve(),
        },
    } as unknown as vscode.ExtensionContext;

    suiteSetup(() => {
        // Initialize ConfigManager with the mocked context
        ConfigManager.initialize(mockContext);
    });

    test('Should return default sqliteDbPath if not configured', () => {
        const expectedPath = path.join(os.homedir(), '.getterm', 'getterm.db');
        const actualPath = ConfigManager.sqliteDbPath;
        assert.strictEqual(actualPath, expectedPath, 'sqliteDbPath should return the default value if not set.');
    });

    test('Should return default notebookHome if workspace not open', () => {
        const expectedPath = path.join(os.homedir(), 'Documents');
        const actualPath = ConfigManager.notebookHome;
        assert.strictEqual(actualPath, expectedPath, 'notebookHome should return the default path if workspace not set.');
    });

    test('Should return default downloadHome based on notebookHome', () => {
        const expectedPath = path.join(ConfigManager.notebookHome, '.getterm');
        const actualPath = ConfigManager.downloadHome;
        assert.strictEqual(actualPath, expectedPath, 'downloadHome should be derived from notebookHome.');
    });

    test('Should update sqliteDbPath globally', async () => {
        const newPath = path.join(os.homedir(), 'custom', 'sqlite.db');
        await ConfigManager.setSqliteDbPath(newPath);

        const updatedPath = ConfigManager.sqliteDbPath;
        assert.strictEqual(updatedPath, newPath, 'sqliteDbPath should update to the new global path.');
    });

    test('Should update notebookHome for the workspace', async () => {
        const newNotebookHome = path.join(os.homedir(), 'Workspace', 'Notebooks');
        await ConfigManager.setNotebookHome(newNotebookHome);

        const updatedNotebookHome = ConfigManager.notebookHome;
        assert.strictEqual(
            updatedNotebookHome,
            newNotebookHome,
            'notebookHome should update to the new workspace path.'
        );
    });

    test('Should update downloadHome for the workspace', async () => {
        const newDownloadHome = path.join(os.homedir(), 'Workspace', 'Downloads');
        await ConfigManager.setDownloadHome(newDownloadHome);

        const updatedDownloadHome = ConfigManager.downloadHome;
        assert.strictEqual(
            updatedDownloadHome,
            newDownloadHome,
            'downloadHome should update to the new workspace path.'
        );
    });

    test('Should set and get log level globally', async () => {
        const newLogLevel = 'debug';
        await ConfigManager.setLogLevel(newLogLevel);

        const config = vscode.workspace.getConfiguration('getterm');
        const currentLogLevel = config.get<string>('logLevel');
        assert.strictEqual(currentLogLevel, newLogLevel, 'logLevel should update to the new global level.');
    });
});
