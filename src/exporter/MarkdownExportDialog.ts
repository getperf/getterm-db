import * as vscode from "vscode";
import { ExportParameters } from "./MarkdownExport";

// クラス: エクスポートダイアログ
export class MarkdownExportDialog {
    private panel: vscode.WebviewPanel | null = null;

    constructor(
        private notebookName: string,
        private defaultExportPath: vscode.Uri
    ) {}

    public async getExportParametersByDialog(): Promise<ExportParameters | null> {
        this.panel = vscode.window.createWebviewPanel(
            "exportDialog",
            "Export Notebook",
            vscode.ViewColumn.Active,
            { enableScripts: true }
        );

        this.panel.webview.html = this.getWebviewContent();
        return new Promise((resolve) => {
            const messageHandler = this.panel!.webview.onDidReceiveMessage(
                async (message) => {
                    if (message.command === "selectSaveLocation") {
                        const uri = await vscode.window.showSaveDialog({
                            saveLabel: "Export File",
                            filters: { ".md": ["md"], "All Files": ["*"] },
                            defaultUri: this.defaultExportPath,
                        });
                        this.dispose();
                        console.log("export file:", uri);
                        if (!uri) { 
                            resolve(null);
                        } else {
                            const result: ExportParameters = {
                                includeMetadata: message.data.includeMetadata,
                                includeOutput: message.data.includeOutput,
                                trimLineCount: parseInt(message.data.trimLineCount, 10),
                                openMarkdown: message.data.openMarkdown,
                                exportPath: uri,
                            };
                            resolve(result);
                        }
                    } else if (message.command === "cancel") {
                        this.dispose();
                        resolve(null);
                    }
                }
            );

            this.panel!.onDidDispose(() => {
                messageHandler.dispose();
            });
        });
    }

    private getWebviewContent(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Export Markdown</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 10px; max-width: 400px; margin: auto; }
        h1 { font-size: 1.5em; margin-bottom: 8px; }
        label { display: block; margin-top: 8px; font-weight: bold; }
        input[type="checkbox"] { margin-right: 5px; }
        input[type="number"], button { margin-top: 5px; padding: 4px; }
        button { cursor: pointer; margin-top: 10px; background-color: #007acc; color: white; border: none; padding: 6px; }
        button:hover { background-color: #005f9e; }
    </style>
</head>
<body>
    <h1>Export Markdown: ${this.notebookName}</h1>
    <form id="exportForm">
        <label>
            <input type="checkbox" id="includeMetadata" />
            Include Metadata
        </label>
        <label>
            <input type="checkbox" id="includeOutput" checked />
            Include Execution Results
        </label>
        <label>Trim Line Count (Number of lines to keep at start and end):
            <input id="trimLineCount" type="number" value="5" min="1" />
        </label>
        <label>
            <input type="checkbox" id="openMarkdown" checked />
            Open Markdown File After Export
        </label>
        <button type="button" id="saveButton">Export</button>
        <button type="button" id="cancelButton">Cancel</button>
    </form>
    <script>
        const vscode = acquireVsCodeApi();
        document.getElementById("saveButton").addEventListener("click", () => {
            const data = {
                includeMetadata: document.getElementById("includeMetadata").checked,
                includeOutput: document.getElementById("includeOutput").checked,
                trimLineCount: document.getElementById("trimLineCount").value,
                openMarkdown: document.getElementById("openMarkdown").checked,
            };
            vscode.postMessage({ command: "selectSaveLocation", data });
        });
        document.getElementById("cancelButton").addEventListener("click", () => {
            vscode.postMessage({ command: "cancel" });
        });
    </script>
</body>
</html>
`;
    }

    private dispose() {
        if (this.panel) {
            this.panel.dispose();
            this.panel = null;
        }
    }
}
