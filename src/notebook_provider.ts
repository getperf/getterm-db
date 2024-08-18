import * as vscode from 'vscode';
import { TerminalNotebookSerializer } from './notebook_serializer';
import { NOTEBOOK_TYPE, TerminalNotebookController } from './notebook_controller';
import { initializeDatabase, Database } from './database';

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
            })
        );
    }

    private registerEventHandlers() {
    }
}
