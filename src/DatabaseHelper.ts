import * as sqlite3 from "sqlite3";

/**
 * DatabaseHelper provides utility methods for executing common database operations
 * such as running queries, fetching single rows, or fetching multiple rows.
 * This class simplifies SQLite database interactions and promotes code reuse.
 */
export class DatabaseHelper {
    private db: sqlite3.Database;

    /**
     * Constructs a new DatabaseHelper instance with the provided database connection.
     * @param database - The SQLite database instance to use for executing queries.
     */
    constructor(database: sqlite3.Database) {
        this.db = database;
    }

    /**
     * Retrieves the row ID of the last inserted row.
     * This must be called immediately after an `INSERT` query.
     * @returns A promise that resolves with the last inserted row ID.
     */
    async lastInsertRowId(): Promise<number> {
        return new Promise((resolve, reject) => {
            const query = "SELECT last_insert_rowid() AS id";
            this.db.get(query, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve((row as { id: number }).id);
                }
            });
        });
    }

    /**
     * Executes a SQL query that does not return any results (e.g., INSERT, UPDATE, DELETE).
     * @param query - The SQL query to execute.
     * @param params - An optional array of parameters to bind to the query.
     * @returns A promise that resolves when the query has completed.
     */
    runQuery(query: string, params: any[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    /**
     * Executes a SQL query and retrieves a single row from the database.
     * @param query - The SQL query to execute.
     * @param params - An optional array of parameters to bind to the query.
     * @returns A promise that resolves with the first row that matches the query,
     * or `null` if no rows are found.
     */
    getQuery<T>(query: string, params: any[] = []): Promise<T | null> {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve((row as T) || null);
            });
        });
    }

    /**
     * Executes a SQL query and retrieves all rows that match the query.
     * @param query - The SQL query to execute.
     * @param params - An optional array of parameters to bind to the query.
     * @returns A promise that resolves with an array of rows that match the query.
     */
    allQuery<T>(query: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows as T[]);
            });
        });
    }
}
