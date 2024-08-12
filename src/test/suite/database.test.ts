import * as path from 'path';
import * as fs from 'fs';
import { strict as assert } from 'assert';
import { Database } from '../../database';
import { Config } from '../../config';
import * as vscode from 'vscode';

suite('Database Class', () => {
    // const workspaceRoot = __dirname;
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
    let db: Database;

    suiteSetup(() => {
        // テスト前にConfigの初期設定を行う
        const config = Config.getInstance();
        config.set('sqliteDbPath', 'session.db'); // テスト用のDBファイルパスを設定
    });

    suiteSetup(() => {
        // suite全体のセットアップをここで行うことも可能
    });

    suiteTeardown(() => {
        // suite全体のクリーンアップをここで行うことも可能
    });

    setup(async () => {
        db = new Database(workspaceRoot);
        await db.initialize();
    });

    teardown(() => {
        const dbPath = path.join(workspaceRoot, 'session.db');
        try {
            require('fs').unlinkSync(dbPath);
        } catch (err) {
            console.error('テストDBファイルの削除に失敗しました:', err);
        }
    });

    test('should create a new database with the correct path', async () => {
        const dbPathSetting = Config.getInstance().get('sqliteDbPath') as string;
        const expectedPath = path.join(workspaceRoot, dbPathSetting);
        assert.strictEqual(db.dbPathUri?.fsPath, expectedPath, 'データベースのパスが正しく設定されていません');
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
        const uninitializedDb = new Database(workspaceRoot);
        assert.throws(() => uninitializedDb.getDBInstance(), /データベースが初期化されていません。/, '初期化されていないデータベースインスタンスが取得されました');
    });

    test('should close the database connection without error', () => {
        assert.doesNotThrow(() => db.close(), 'データベースのクローズ時にエラーが発生しました');
    });

    test('should throw an error if the database cannot be created', async () => {
        const invalidDb = new Database('/invalid/path');
        await assert.rejects(invalidDb.initialize(), /データベースの作成に失敗しました/, '不正なパスでデータベースが作成されました');
    });
});
