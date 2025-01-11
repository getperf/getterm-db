import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseUpgrader } from './DatabaseUpgrader';
import { Session } from './model/Session';
import { Command } from './model/Command';
import { Note } from './model/Note';
import { Cell } from './model/Cell';
import { Logger } from './Logger';
import { ConfigManager } from './ConfigManager';

export class DatabaseManager {
    private static instance: DatabaseManager | null = null;
    private db: sqlite3.Database | null = null;

    private constructor() {}

    static async initialize(): Promise<DatabaseManager>  {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
            await DatabaseManager.instance.setupDatabase();
        }
        return DatabaseManager.instance;
    }

    async setupDatabase(dbPath?: string): Promise<void> {
        const databasePath = dbPath || this.getDefaultDatabasePath();

        const baseDir = path.dirname(databasePath);
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }

        this.db = new sqlite3.Database(databasePath, (err) => {
            if (err) {throw new Error(`Failed to open database: ${err.message}`);}
        });

        if (this.db) {
            const upgrader = new DatabaseUpgrader(this.db);
            await upgrader.upgradeDatabase();
        }
        Session.setup(this.db);
        Command.setup(this.db);
        Note.setup(this.db);
        Cell.setup(this.db);
        Logger.info(`Database initialized: ${databasePath}`);
    }

    private getDefaultDatabasePath(): string {
        return ConfigManager.sqliteDbPath;
    }

    getDatabase(): sqlite3.Database | null {
        return this.db;
    }

    async closeDatabase(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}
