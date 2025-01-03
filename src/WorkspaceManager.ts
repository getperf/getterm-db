import * as vscode from 'vscode';

export class WorkspaceManager {
    static checkWorkspaceOpened(): boolean {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return true;
        } else {
            return false;
        }
    }    

    /**
     * ワークスペースが開いているか確認し、開いていない場合はユーザーにフォルダを選択させます。
     * @returns {Promise<boolean>} ワークスペースが開いている場合は `true`、ユーザーがフォルダを選択した場合も `true`、キャンセルした場合は `false`。
     */
    static async ensureWorkspaceIsOpen(): Promise<boolean> {
        console.log("ensureWorkspaceIsOpen");
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            // 既にワークスペースが開いている
            return true;
        }

        const userChoice = await vscode.window.showWarningMessage(
            "事前にワークスペースを開いてください。新しいディレクトリを選択しますか？",
            { modal: true },
            "ディレクトリを選択"
        );

        if (userChoice === "ディレクトリを選択") {
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: "ワークスペースにするフォルダを選択"
            });

            if (folderUri && folderUri[0]) {
                // 選択されたフォルダでワークスペースを開く
                await vscode.commands.executeCommand('vscode.openFolder', folderUri[0]);
                return true;
            }
        }

        vscode.window.showInformationMessage("ワークスペースが開かれていないため、処理を中断します。");
        return false;
    }
}
