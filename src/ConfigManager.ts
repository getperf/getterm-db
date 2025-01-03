import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

export class ConfigManager {
    private static context: vscode.ExtensionContext;

    /**
     * Set the context for configuration management.
     * This method must be called during the extension's activation to set the context.
     * @param context - The extension context provided by VSCode.
     */
    public static initialize(context: vscode.ExtensionContext): void {
        this.context = context;
    }

    /**
     * Retrieves a configuration parameter value. If the parameter is not set,
     * the specified default value is returned.
     * @param parameterName - The name of the configuration parameter.
     * @param defaultValue - The default value to return if the parameter is not set.
     * @returns The value of the parameter or the default value if not set.
     */
    static getParameter<T>(parameterName: string, defaultValue: T): T {
        const config = vscode.workspace.getConfiguration('getterm-sqlite');
        const value = config.get<T>(parameterName, defaultValue);
        if (value === undefined || value === null || value === "") {
            return defaultValue;
        }
        return value;
    }

    /**
     * Gets the path to the SQLite database file.
     * Defaults to `globalStorageUri` under the extension's context.
     * @returns The SQLite database file path.
     */
    public static get sqliteDbPath(): string {
        // const defaultPath = path.join(this.context.globalStorageUri.fsPath, 'getterm.sqlite');
        const defaultPath = path.join(os.homedir(), '.getterm', 'getterm.db');
        return this.getParameter('sqliteDbPath', defaultPath);
    }

    /**
     * Gets the home directory for storing notebooks.
     * Defaults to the workspace directory if open; otherwise, the current directory.
     * @returns The notebook home directory path.
     */
    public static get notebookHome(): string {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
        return this.getParameter('notebookHome', workspaceFolder);
    }

    /**
     * Gets the directory used for downloads.
     * Defaults to a `.getterm` subdirectory inside the notebook home.
     * @returns The download directory path.
     */
    public static get downloadHome(): string {
        const defaultDownloadHome = path.join(this.notebookHome, '.getterm');
        return this.getParameter('downloadHome', defaultDownloadHome);
    }

    /**
     * Gets the current log level for the extension.
     * Defaults to `"info"` if not specified.
     * @returns The log level as a string.
     */
    public static get logLevel(): string {
        return this.getParameter('logLevel', 'info');
    }

    /**
     * Updates a configuration parameter with a new value.
     * @param name - The name of the parameter to update.
     * @param value - The new value to set.
     * @param target - The configuration target (Global or Workspace).
     */
    private static async setParameter<T>(name: string, value: T, target: vscode.ConfigurationTarget): Promise<void> {
        const config = vscode.workspace.getConfiguration('getterm');
        await config.update(name, value, target);
    }

    /**
     * Sets the log level for the extension.
     * @param newLevel - The new log level to set.
     */
    public static async setLogLevel(newLevel: string): Promise<void> {
        await this.setParameter('logLevel', newLevel, vscode.ConfigurationTarget.Global);
    }

    /**
     * Sets the path to the SQLite database file.
     * @param newPath - The new path to the SQLite database file.
     */
    public static async setSqliteDbPath(newPath: string): Promise<void> {
        await this.setParameter('sqliteDbPath', newPath, vscode.ConfigurationTarget.Global);
    }

    /**
     * Sets the home directory for storing notebooks.
     * @param newPath - The new notebook home directory path.
     */
    public static async setNotebookHome(newPath: string): Promise<void> {
        await this.setParameter('notebookHome', newPath, vscode.ConfigurationTarget.Workspace);
    }

    /**
     * Sets the directory used for downloads.
     * @param newPath - The new download directory path.
     */
    public static async setDownloadHome(newPath: string): Promise<void> {
        await this.setParameter('downloadHome', newPath, vscode.ConfigurationTarget.Workspace);
    }
}
