import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import { ConfigManager } from "../../ConfigManager";

suite("ConfigManager Tests", function () {
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
        ConfigManager.initialize(mockContext);
    });

    test("Should update sqliteDbPath globally", async () => {
        const newPath = path.join(os.homedir(), "custom", "sqlite.db");
        await ConfigManager.setSqliteDbPath(newPath);

        const updatedPath = ConfigManager.sqliteDbPath;
        assert.strictEqual(
            updatedPath,
            newPath,
            "sqliteDbPath should update to the new global path.",
        );
    });

    test("Should set and get log level globally", async () => {
        const newLogLevel = "debug";
        await ConfigManager.setLogLevel(newLogLevel);

        const config = vscode.workspace.getConfiguration("getterm-db");
        const currentLogLevel = config.get<string>("logLevel");
        assert.strictEqual(
            currentLogLevel,
            newLogLevel,
            "logLevel should update to the new global level.",
        );
    });
});
