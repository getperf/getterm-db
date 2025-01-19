import * as vscode from 'vscode';

export class NotebookMarkdownCellAdder {
    private readonly context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerCommand();
    }

    private registerCommand(): void {
        const command = 'getterm-db.addMarkdownCell';
        this.context.subscriptions.push(vscode.commands.registerCommand(command, () => {
            this.promptForMarkdown();
        }));
    }

    private async promptForMarkdown(): Promise<void> {
        const headingOptions = ['Text', 'Heading (#)', 'Heading 2 (##)', 'Heading 3 (###)'];

        const selectedHeading = await vscode.window.showQuickPick(headingOptions, {
            placeHolder: 'Select heading level or plain text',
        });
    
        if (!selectedHeading) {
            vscode.window.showInformationMessage('No heading selected.');
            return;
        }
    
        const input = await vscode.window.showInputBox({
            prompt: 'Enter Markdown text to add to the notebook',
            placeHolder: 'Type your markdown here...',
        });

        if (input !== undefined && input.trim() !== '') {
            let prefix = '';
            if (selectedHeading.includes('#')) {
                prefix = selectedHeading.match(/#+/)?.[0] || '';
                this.addMarkdownCellToNotebook(`${prefix} ${input}`);
            } else {
                this.addMarkdownCellToNotebook(input);
            }
        } else {
            vscode.window.showInformationMessage('No markdown text was provided.');
        }
    }

    private async addMarkdownCellToNotebook(markdownText: string): Promise<void> {
        const notebookEditor = vscode.window.activeNotebookEditor;
        if (!notebookEditor) {
            vscode.window.showErrorMessage('No active notebook editor found.');
            return;
        }

        const newCell = new vscode.NotebookCellData(
            vscode.NotebookCellKind.Markup,
            markdownText,
            'markdown'
        );

        const notebook = notebookEditor.notebook;
        const edit = vscode.NotebookEdit.insertCells(notebook.cellCount, [newCell]);
        const editData = new vscode.WorkspaceEdit();
        editData.set(notebook.uri, [edit]);

        await vscode.workspace.applyEdit(editData);
        const lastCellIndex = notebook.cellCount - 1;
        notebookEditor.revealRange(
            new vscode.NotebookRange(lastCellIndex, lastCellIndex), 
            vscode.NotebookEditorRevealType.InCenter
        );
    }
}
