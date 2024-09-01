import * as vscode from 'vscode';
import { TerminalNotebookSerializer } from './notebook_serializer';
import { NOTEBOOK_TYPE, TerminalNotebookController } from './notebook_controller';
import { initializeDatabase, Database } from './database';
import { Logger } from './logger';

export class TerminalNotebookProvider {
    private context: vscode.ExtensionContext;
    private db!: Promise<Database>;

    serializer = new TerminalNotebookSerializer();
    controller = new TerminalNotebookController();
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommands();
        this.registerEventHandlers();
        if (!this.db) {
            this.db = initializeDatabase();
        }
    }

    private registerCommands() {
		this.context.subscriptions.push(
            vscode.workspace.registerNotebookSerializer(
                NOTEBOOK_TYPE, this.serializer, { transientOutputs: true }
    		),
	    	this.controller,
            vscode.commands.registerCommand('getterm-db.createNewTerminalNotebook', async () => {
                this.controller.createNotebook();
            }),
            vscode.commands.registerCommand('getterm-db.copyCode', (cell: vscode.NotebookCell) => {
                vscode.env.clipboard.writeText(cell.document.getText()).then(() => {
                    vscode.window.showInformationMessage('Code copied to clipboard!');
                });
            })
        );

        
    }

    private registerEventHandlers() {
        // Enable auto-save for notebooks
        vscode.workspace.onDidChangeNotebookDocument((e) => {
            const notebookUri = e.notebook.uri;
            if (e.contentChanges.length > 0) {
                e.notebook.save();
                Logger.info(`notebook saved automatically.`);
            }
        });
    }
}
