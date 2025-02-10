import * as vscode from "vscode";
import { Command } from "./model/Command";
import { NotebookCleaner } from "./NotebookCleaner";
import { TerminalSessionManager } from "./TerminalSessionManager";
import { Logger } from "./Logger";
import { TerminalNotebookSessionPicker } from "./NotebookSessionPicker";
import { TerminalNotebookHandler } from "./NotebookHandler";
import { ConfigManager } from "./ConfigManager";
export const NOTEBOOK_TYPE = "terminal-notebook";

/**
 * TerminalNotebookController class is responsible for managing notebook execution and updates
 * within a terminal session in VSCode. It allows capturing terminal commands, saving them
 * as notebook cells, and maintaining session-specific notebook data.
 */

export class TerminalNotebookController {
    readonly controllerId = "terminal-notebook-executor";
    readonly notebookType = NOTEBOOK_TYPE;
    readonly label = "Terminal Notebook";
    readonly supportedLanguages = ["shellscript"];
    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;

    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label,
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this._execute.bind(this);
    }

    /**
     * Handles the sequential execution of notebook cells.
     * Executes each cell asynchronously, ensuring order and output logging.
     */
    private async _execute(
        cells: vscode.NotebookCell[],
        _notebook: vscode.NotebookDocument,
        _controller: vscode.NotebookController,
    ): Promise<void> {
        Logger.info("_execute cell invoked.");
        for (let cell of cells) {
            // run each cell sequentially, awaiting its completion
            await this.doExecution(cell);
        }
    }

    /**
     * Executes an individual notebook cell by running the command it contains.
     * Creates an execution object, starts it, handles success or error outputs,
     * and ends the execution.
     */
    private async doExecution(cell: vscode.NotebookCell): Promise<void> {
        try {
            const command_id = cell.metadata?.id;
            if (!command_id) {
                throw new Error(`Command id not found in cell`);
            }
            const command = await Command.getById(command_id);
            if (!command) {
                throw new Error(
                    `Commmand with id ${command_id} not found in DB`,
                );
            }
            const execution =
                this._controller.createNotebookCellExecution(cell);
            execution.executionOrder = ++this._executionOrder;
            execution.start(new Date(command.start).getTime());
            Logger.info(
                `execute cell at ${cell.index}, command id is ${command_id}`,
            );
            const command_success = command.exit_code === 0;
            if (command_success) {
                writeSuccess(execution, [[text(command.output)]]);
            } else {
                writeErr(execution, command.output);
            }
            execution.end(command_success, new Date(command.end).getTime());
        } catch (error) {
            vscode.window.showErrorMessage(`${error}`);
        }
    }

    
    /**
     * Creates or updates a notebook based on the current terminal session status.
     * If a session is active, it loads command history into the notebook.
     */
    public async createTemporaryNotebook() {
        const notebookHandler = TerminalNotebookHandler.create();
        const lastSavePath = ConfigManager.lastSavePath;
        const options: vscode.SaveDialogOptions = {
            saveLabel: "Create Notebook",
            defaultUri: notebookHandler.defaultUri(lastSavePath),
            filters: { "GetTerm terminal capture Notebooks": ["getterm"] },
        };
        const notebookUri = await vscode.window.showSaveDialog(options);
        if (!notebookUri) {
            vscode.window.showInformationMessage(
                "Notebook creation was canceled.",
            );
            return;
        }
        // 選択したパスをストレージに保存
        ConfigManager.setLastSavePath(notebookUri);

        const emptyNotebookContent = JSON.stringify(
            notebookHandler.createEmptyNotebook(),
        );
        try {
            await vscode.workspace.fs.writeFile(
                notebookUri,
                Buffer.from(emptyNotebookContent),
            );
            await vscode.commands.executeCommand(
                "vscode.openWith",
                notebookUri,
                NOTEBOOK_TYPE,
            );
            vscode.window.showInformationMessage(
                `Terminal notebook opend : ${notebookUri.fsPath}`,
            );
            // TerminalNotebookSessionPicker.showExplorerAndOutline();
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to create or open new notebook: ${error}`,
            );
        }
        // await vscode.commands.executeCommand("getterm-db.selectSession");
        // const sessionPicker = new TerminalNotebookSessionPicker(vscode.extensions.getExtension('your.extension.id')!.exports.context);
        const terminal = vscode.window.activeTerminal;
        if (terminal) {
            await TerminalNotebookSessionPicker.bindNotebookToTerminal(terminal);          
        }
        // await TerminalNotebookSessionPicker.bindNotebookToTerminal()
        await vscode.commands.executeCommand("workbench.action.toggleSidebarVisibility");
    }

    /**
     * Updates the active notebook with a new command cell and triggers its execution.
     */
    public async updateNotebook(rowid: number) {
        const activeTerminal = vscode.window.activeTerminal;
        if (!activeTerminal) {
            vscode.window.showInformationMessage(
                "No active terminal is currently selected.",
            );
            return;
        }
        const notebookEditor =
            TerminalSessionManager.getSession(activeTerminal).notebookEditor;
        if (!notebookEditor) {
            vscode.window.showErrorMessage("no active notebook editor found!");
            return;
        }
        const sessionId = TerminalSessionManager.getSessionId(activeTerminal);
        if (!sessionId) {
            vscode.window.showInformationMessage(
                "The terminal is not opened by Getterm.",
            );
            return;
        }
        Logger.info(
            `update notebook session id : ${sessionId} , command id : ${rowid}`,
        );

        NotebookCleaner.cleanupUnusedCells();

        const notebookHandler = TerminalNotebookHandler.create(notebookEditor);
        const row = await Command.getById(rowid);
        await notebookHandler.insertCommandCell(row);
        Logger.info(`update notebook add cell command : ${row.command}`);
    }

    dispose() {
        // Clean up resources
    }
}

/* Helper functions for output formatting */
function writeErr(execution: vscode.NotebookCellExecution, err: string) {
    const redTextErr = `\u001b[31m${err}\u001b[0m`;
    execution.replaceOutput([
        new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.text(redTextErr),
        ]),
    ]);
}

const { text, json } = vscode.NotebookCellOutputItem;

function writeSuccess(
    execution: vscode.NotebookCellExecution,
    outputs: vscode.NotebookCellOutputItem[][],
) {
    execution.replaceOutput(
        outputs.map((items) => new vscode.NotebookCellOutput(items)),
    );
}
