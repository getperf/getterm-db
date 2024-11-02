import * as vscode from 'vscode';

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export class Logger {
    private static outputChannel: vscode.OutputChannel;
    private static logLevel = LogLevel.INFO;

    static setup(outputChannel: vscode.OutputChannel, context?: vscode.ExtensionContext) {
        Logger.outputChannel = outputChannel;
        Logger.logLevel = LogLevel.INFO;

        // Register VSCode command to change log level
        const setLogLevelCommand = vscode.commands.registerCommand('getterm-db.setLogLevel', async () => {
            const selectedLevel = await vscode.window.showQuickPick(
                Object.values(LogLevel),
                { placeHolder: 'Select log level' }
            );
            if (selectedLevel) {
                Logger.setLogLevel(selectedLevel as LogLevel);
                vscode.window.showInformationMessage(`Log level set to ${selectedLevel}`);
            }
        });
        if (context) {
            context.subscriptions.push(setLogLevelCommand);
        }
    }

    static setLogLevel(logLevel: LogLevel) {
        Logger.logLevel = logLevel;
    }

    static logMessage(level: LogLevel, message: string) {
        const now = new Date();
        const timestamp = now.toLocaleTimeString();
        Logger.outputChannel?.appendLine(`[${timestamp}] [${level}] ${message}`);
    }

	static show(visible: boolean) {
        Logger.outputChannel?.show(visible);
	}

    static debug(message: string) {
        if (this.logLevel > LogLevel.DEBUG) { return; }
        this.logMessage(LogLevel.DEBUG, message);
    }
    
    static info(message: string) {
        if (this.logLevel > LogLevel.INFO) { return; }
        this.logMessage(LogLevel.INFO, message);
    }

    static warn(message: string) {
        if (this.logLevel > LogLevel.WARN) { return; }
        this.logMessage(LogLevel.WARN, message);
    }

    static error(message: string) {
        if (this.logLevel > LogLevel.ERROR) { return; }
        this.logMessage(LogLevel.ERROR, message);
    }

}
