import * as assert from 'assert';
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import { DatabaseManager } from '../../DatabaseManager';
import { DatabaseUpgrader } from '../../DatabaseUpgrader';
import * as os from 'os';

suite('DatabaseManager and DatabaseUpgrader Tests', () => {
    const dbPath = `${os.tmpdir()}/test-database.db`;

    test('DatabaseManager initializes and creates metadata table', async () => {
        const manager = await DatabaseManager.initialize();
        // await manager.initialize(dbPath);

        const db = manager.getDatabase();
        assert.ok(db, 'Database should be initialized');

        db?.get("SELECT name FROM sqlite_master WHERE type='table' AND name='metadata'", (err, row) => {
            assert.strictEqual(err, null, 'Error should be null');
            assert.ok(row, 'Metadata table should exist');
        });

        manager.closeDatabase();
    });

    test('DatabaseUpgrader applies migrations correctly', async () => {
        const db = new sqlite3.Database(dbPath);
        console.log("DBPATH : ", dbPath);
        const upgrader = new DatabaseUpgrader(db);
        await upgrader.upgradeDatabase();

        // メタデータテーブルのバージョンを確認
        db.get("SELECT value FROM metadata WHERE key='version'", (err: Error | null, row: { value: string } | undefined) => {
            assert.strictEqual(err, null, 'Error should be null');
            assert.strictEqual(row?.value, '1', 'Database version should be 1');
        });

        // セルテーブルが作成されたか確認
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='cells'", (err, row) => {
            assert.strictEqual(err, null, 'Error should be null');
            assert.ok(row, 'Cells table should exist');
        });

        db.close();
    });

    test('DatabaseManager singleton instance works correctly', async () => {
        const instance1 = await DatabaseManager.initialize();
        const instance2 = await DatabaseManager.initialize();
        assert.strictEqual(instance1, instance2, 'Singleton instances should be the same');
    });
});
