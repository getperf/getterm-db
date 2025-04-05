import * as vscode from "vscode";
import { ExportParameters } from "./MarkdownExport";
import { title } from "process";

export type ExportTypeDefinition = {
    title: string;
    extension: string;
    extensionTitle: string;
  };
  
  export const ExportTypes: { [key: string]: ExportTypeDefinition } = {
    markdown: { title: "Markdown", extension: "md", extensionTitle: ".md" },
    excel: { title: "Excel", extension: "xlsx", extensionTitle: ".xlsx" },
  };

// クラス: エクスポートダイアログ
export class ExportDialog {
    private panel: vscode.WebviewPanel | null = null;
    private defaultExportPath: vscode.Uri;
    private exportType : ExportTypeDefinition;

    constructor(
        private notebookName: string,
        exportKey: string,
    ) {
        this.exportType = ExportTypes[exportKey];
        const extension = this.exportType.extension;
        this.defaultExportPath = vscode.Uri.file(
            `${notebookName.replace(/\.[^/.]+$/, "")}.${extension}`
        );
    }

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
                    const extension = this.exportType.extension;
                    const extensionTitle = this.exportType.extensionTitle;
                    if (message.command === "selectSaveLocation") {
                        const uri = await vscode.window.showSaveDialog({
                            saveLabel: "Export File",
                            filters: { ".{md|xlsx}": [extension], "All Files": ["*"] },
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
                                includeCommandInfo: this.exportType.extension === "xlsx" ? true : message.data.includeCommandInfo,
                                trimLineCount: parseInt(message.data.trimLineCount, 10),
                                openMarkdown: message.data.openMarkdown,
                                captionCommandOutput: message.data.captionCommandOutput,
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
    <title>Export ${this.exportType.title}</title>
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
    <h1>Export ${this.exportType.title}</h1>
    <form id="exportForm">
        <label>Input File: [${this.notebookName}]
        <label>Include Options:</label>
        <label>
            <input type="checkbox" id="includeMetadata" />
            Include Session Details
        </label>
        <label>
            <input type="checkbox" id="includeOutput" checked />
            Export Command Outputs(Default)
        </label>
        <label>
            <input type="checkbox" id="includeCommandInfo" 
            ${this.exportType.extension === "xlsx" ? "checked" : ""} />
            Include Command Metadata (Elapsed Time, Exit Code, etc.)
        </label>
        <label>
            <input type="checkbox" id="captionCommandOutput" checked />
            Caption Command Output (Markdown only)
        </label>
        <label>Output Settings:</label>
        <label>Lines to keep (Start/End):
            <input id="trimLineCount" type="number" value="5" min="1" />
        </label>
        <label>
            <input type="checkbox" id="openMarkdown" checked />
            Open File After Export
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
                includeCommandInfo: document.getElementById("includeCommandInfo").checked,
                trimLineCount: document.getElementById("trimLineCount").value,
                openMarkdown: document.getElementById("openMarkdown").checked,
                captionCommandOutput: document.getElementById("captionCommandOutput").checked,
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
