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

    static setup(outputChannel: vscode.OutputChannel) {
        Logger.outputChannel = outputChannel;
        Logger.logLevel = LogLevel.INFO;
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
