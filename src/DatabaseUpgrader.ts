import * as sqlite3 from 'sqlite3';
import { createTableSQL } from './sql/tables';
import { Logger } from './Logger';

export class DatabaseUpgrader {
    private db: sqlite3.Database;
    private currentVersion = 1; // 最新のバージョン番号を定義

    constructor(db: sqlite3.Database) {
        this.db = db;
    }

    async upgradeDatabase(): Promise<void> {
        const version = await this.getDatabaseVersion();
        if (version < this.currentVersion) {
            await this.applyMigrations(version);
        }
        Logger.info(`Current db version: ${this.currentVersion}`);
    }

    private async getDatabaseVersion(): Promise<number> {
        const query = `CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT)`;
        await this.runQuery(query);

        const selectVersionQuery = `SELECT value FROM metadata WHERE key = 'version'`;
        const version = await this.getSingleResult(selectVersionQuery);
        return version ? parseInt(version) : 0;
    }

    private async applyMigrations(currentVersion: number): Promise<void> {
        const migrations = [
            {
                version: 1,
                script: createTableSQL,
            },
        ];

        for (const migration of migrations) {
            Logger.info(`Update database version ${migration.version}`);
            if (migration.version > currentVersion) {
                for (const query of migration.script) {
                    await this.runQuery(query);
                }
                await this.updateVersion(migration.version);
            }
        }
    }

    private async updateVersion(version: number): Promise<void> {
        const query = `
        INSERT INTO metadata (key, value)
        VALUES ('version', '${version}')
        ON CONFLICT(key) DO UPDATE SET value = '${version}'`;
        await this.runQuery(query);
    }

    private runQuery(query: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(query, (err) => {
                if (err) {return reject(err);}
                resolve();
            });
        });
    }

    private getSingleResult(query: string): Promise<string | null> {
        return new Promise((resolve, reject) => {
            this.db.get(query, (err, row: { value: string }) => {
                if (err) {return reject(err);}
                resolve(row ? row.value : null);
            });
        });
    }
}
