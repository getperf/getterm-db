export const createTableSQL: string[] = [
    `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_name TEXT,
    description TEXT,
    execute_path TEXT,
    execute_args TEXT,
    remote_type TEXT,
    remote_host TEXT,
    remote_user TEXT,
    start DATETIME,
    end DATETIME
)`,
    `CREATE TABLE IF NOT EXISTS commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    command TEXT,
    output TEXT,
    cwd TEXT,
    exit_code INTEGER,
    file_operation_mode TEXT 
        CHECK(file_operation_mode IN ('downloaded', 'failed', 'canceled')) 
        NOT NULL DEFAULT 'canceled',
    command_access_file TEXT,
    download_file TEXT,
    start DATETIME,
    end DATETIME,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
)`,
    `CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
    `CREATE TABLE IF NOT EXISTS cells (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notebook_id INTEGER NOT NULL,
    session_id INTEGER,
    command_id INTEGER,
    content TEXT NOT NULL,
    type TEXT CHECK(type IN ('code', 'markdown')),
    position INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notebook_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (command_id) REFERENCES commands(id)
)`,
];
