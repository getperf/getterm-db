import * as path from 'path';
import * as fs from 'fs';
import { strict as assert } from 'assert';
import { Database } from '../../Database';
import { Config, SessionDb, ConfigFile, ConfigVersion } from '../../Config';
import * as vscode from 'vscode';

suite('Database Class', () => {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
    const gettermHome= path.join(workspaceRoot, ".getterm");
    let sqliteDbPath : string;
    let db: Database;

    suiteSetup(() => {
        if (!fs.existsSync(gettermHome)) {
            fs.mkdirSync(gettermHome);
        }
        sqliteDbPath = path.join(gettermHome, SessionDb);
    });

    suiteTeardown(async () => {
        try {
            await db.close();
            // require('fs').unlinkSync(sqliteDbPath);
        } catch (err) {
            console.error('テストDBファイルの削除に失敗しました:', err);
        }
    });

    setup(async () => {
        db = new Database(sqliteDbPath);
        await db.initialize();
    });

    // teardown(() => {
    //     // try {
    //     //     require('fs').unlinkSync(sqliteDbPath);
    //     // } catch (err) {
    //     //     console.error('テストDBファイルの削除に失敗しました:', err);
    //     // }
    // });

    test('should create a new database with the correct path', async () => {
        const sqliteDbPath = Config.getInstance().get('sqliteDbPath') as string;
        const expectedPath = path.join(gettermHome, sqliteDbPath);
        console.log("DB PATH: ", db.sqliteDbPath, expectedPath);
        assert.strictEqual(db.sqliteDbPath, expectedPath, 'データベースのパスが正しく設定されていません');
    });

    test('should create sessions and commands tables', async () => {
        const dbInstance = db.getDBInstance();
        assert.ok(dbInstance, 'データベースインスタンスが初期化されていません');

        // テーブルの存在確認
        dbInstance!.get("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'", (err, row) => {
            assert.ifError(err);
            const result = row as { name: string };
            assert.strictEqual(result?.name, 'sessions', 'sessionsテーブルが作成されていません');
        });

        dbInstance!.get("SELECT name FROM sqlite_master WHERE type='table' AND name='commands'", (err, row) => {
            assert.ifError(err);
            const result = row as { name: string };
            assert.strictEqual(result?.name, 'commands', 'commandsテーブルが作成されていません');
        });
    });

    test('should throw an error if trying to get DB instance before initialization', () => {
        const uninitializedDb = new Database(gettermHome);
        // assert.throws(() => uninitializedDb.getDBInstance(), /データベースが初期化されていません。/, '初期化されていないデータベースインスタンスが取得されました');
        assert.throws(() => uninitializedDb.getDBInstance());
    });

    test('should close the database connection without error', () => {
        assert.doesNotThrow(() => db.close(), 'データベースのクローズ時にエラーが発生しました');
    });

    test('should throw an error if the database cannot be created', async () => {
        const invalidDb = new Database('/invalid/path');
        // await assert.rejects(invalidDb.initialize(), /データベースの作成に失敗しました/, '不正なパスでデータベースが作成されました');
        await assert.rejects(invalidDb.initialize());
    });
});

