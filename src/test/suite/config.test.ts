import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { Config, SessionDb, ConfigFile, ConfigVersion } from '../../Config';

suite('Config Tests', function() {
    let workspaceRoot: string;
    let configFilePath: string;
    let gettermHome: string;

    suiteSetup(function() {
        // ワークスペースディレクトリを取得
        // const workspaceFolders = vscode.workspace.workspaceFolders;
        // if (!workspaceFolders || workspaceFolders.length === 0) {
        //     throw new Error('ワークスペースが開かれていません');
        // }
        // workspaceRoot = workspaceFolders[0].uri.fsPath;
        workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
        gettermHome= path.join(workspaceRoot, ".getterm");
        configFilePath = path.join(gettermHome, ConfigFile);
        if (fs.existsSync(configFilePath)) {
            fs.unlinkSync(configFilePath);
        }
    });

    suiteTeardown(async () => {
        if (fs.existsSync(configFilePath)) {
            fs.unlinkSync(configFilePath);
        }
    });

    setup(function() {
        // 設定ファイルが存在しない場合にのみ作成
        console.log("GETTERM_HOME:", gettermHome);
        if (!fs.existsSync(gettermHome)) {
            fs.mkdirSync(gettermHome);
        }
        if (!fs.existsSync(configFilePath)) {
            fs.writeFileSync(configFilePath, JSON.stringify({
                sqliteDbPath: SessionDb,
                terminalProfiles: [],
                version: ConfigVersion
            }, null, 2));
        }
    });

    test('should create a new config file with default settings', function() {
        const config = Config.getInstance();

        // 設定ファイルの内容を確認
        const settings = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        assert.strictEqual(settings.sqliteDbPath, SessionDb);
        assert.strictEqual(settings.version, ConfigVersion);
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
        config.loadSettings();
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
        config.loadSettings();
        assert.strictEqual(config.get('sqliteDbPath'), SessionDb);
        assert.strictEqual(config.get('version'), ConfigVersion);
    });
});
