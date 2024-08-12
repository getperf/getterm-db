import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { Config } from '../../config'; // クラスのパスを適切に変更

suite('Config Tests', function() {
    let workspaceRoot: string;
    let configFilePath: string;
    let relativeDbPath = 'session.db';
    let defaultDbPath: string;

    suiteSetup(function() {
        // ワークスペースディレクトリを取得
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('ワークスペースが開かれていません');
        }
        workspaceRoot = workspaceFolders[0].uri.fsPath;
        configFilePath = path.join(workspaceRoot, '.getterm.json');
        defaultDbPath = path.join(workspaceRoot, relativeDbPath);
    });

    setup(function() {
        // 設定ファイルが存在しない場合にのみ作成
        if (!fs.existsSync(configFilePath)) {
            fs.writeFileSync(configFilePath, JSON.stringify({
                sqliteDbPath: relativeDbPath,
                terminalProfiles: [],
                version: '1.0'
            }, null, 2));
        }
    });

    teardown(function() {
        // テスト後に設定ファイルを削除
        if (fs.existsSync(configFilePath)) {
            fs.unlinkSync(configFilePath);
        }
    });

    test('should create a new config file with default settings', function() {
        const config = Config.getInstance();

        // 設定ファイルの内容を確認
        const settings = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        assert.strictEqual(settings.sqliteDbPath, relativeDbPath);
        assert.strictEqual(settings.version, '1.0');
    });

    test('should load existing settings from the config file', function() {
        // 設定ファイルにカスタムデータを書き込む
        const initialSettings = {
            sqliteDbPath: 'custom.db',
            terminalProfiles: ['profile1'],
            version: '1.1'
        };
        fs.writeFileSync(configFilePath, JSON.stringify(initialSettings, null, 2), 'utf8');

        const config = Config.getInstance();
        // 設定ファイルから読み込んだデータが正しいか確認
        assert.strictEqual(config.get('sqliteDbPath'), 'custom.db');
        assert.deepStrictEqual(config.get('terminalProfiles'), ['profile1']);
        assert.strictEqual(config.get('version'), '1.1');
    });

    test('should update settings and save to the config file', function() {
        const config = Config.getInstance();

        // 設定を更新
        config.set('sqliteDbPath', 'new/db/path.db');
        config.set('version', '2.0');

        // 設定ファイルの内容を確認
        const settings = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        assert.strictEqual(settings.sqliteDbPath, 'new/db/path.db');
        assert.strictEqual(settings.version, '2.0');
    });

    test('should set default values if not provided', function() {
        // 設定ファイルに値がない場合のデフォルト値の確認
        fs.unlinkSync(configFilePath); // 設定ファイルを削除してデフォルト値の確認
        const config = Config.getInstance();
        assert.strictEqual(config.get('sqliteDbPath'), relativeDbPath);
        assert.strictEqual(config.get('version'), '1.0');
    });
});
