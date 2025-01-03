import * as vscode from 'vscode';

export class NotebookCopyButtonProvider implements vscode.NotebookCellStatusBarItemProvider {
    constructor(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.notebooks.registerNotebookCellStatusBarItemProvider('terminal-notebook', this)
        );
    }

    provideCellStatusBarItems(cell: vscode.NotebookCell): vscode.NotebookCellStatusBarItem | undefined {
        const copyButton = new vscode.NotebookCellStatusBarItem(
            '$(clippy) Copy Code',
            vscode.NotebookCellStatusBarAlignment.Right
        );

        copyButton.command = {
            title: 'Copy Code',
            command: 'getterm-db.copyCode',
            arguments: [cell]
        };

        copyButton.tooltip = 'Copy code to clipboard';
        copyButton.accessibilityInformation = { label: 'Copy code', role: 'button' };
        return copyButton;
    }
}
