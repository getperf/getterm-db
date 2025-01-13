import * as vscode from "vscode";
import { MarkdownExportDialog } from "./MarkdownExportDialog";
import { Command } from "../model/Command";

export interface ExportParameters {
    includeMetadata: boolean;
    includeOutput: boolean;
    trimLineCount: number;
    openMarkdown: boolean;
    exportPath: vscode.Uri;
}

export class MarkdownExport {
    public static async exportNotebook(): Promise<void> {
        const notebookEditor = vscode.window.activeNotebookEditor;

        if (!notebookEditor) {
            vscode.window.showErrorMessage("No active notebook editor found.");
            return;
        }

        const notebookName = notebookEditor.notebook.uri.path.split("/").pop() ?? "Untitled";
        const defaultExportPath = vscode.Uri.file(`${notebookName.replace(/\.[^/.]+$/, "")}.md`);

        const dialog = new MarkdownExportDialog(notebookName, defaultExportPath);
        const params = await dialog.getExportParametersByDialog();
        console.log("export dialog result:", params);
        if (params) {
            vscode.window.showInformationMessage(
                `Exporting notebook "${notebookName}" to "${params.exportPath.fsPath}".`
            );
            this.processExport(params, notebookEditor);
        } else {
            vscode.window.showInformationMessage("Export canceled.");
        }
    }

    private static async processExport(params: ExportParameters, notebookEditor: vscode.NotebookEditor): Promise<void> {
        const exportPath = params.exportPath;
        try {
            const content = await this.convertNotebookToMarkdown(notebookEditor.notebook, params);

            vscode.workspace.fs.writeFile(exportPath, Buffer.from(content, "utf-8")).then(
                () => vscode.window.showInformationMessage(`Exported to "${exportPath.fsPath}".`),
                (err) => { throw new Error(`Failed to write file: ${err.message}`); }
            );
            if (params.openMarkdown) {
                vscode.workspace.openTextDocument(exportPath).then((document) => {
                vscode.window.showTextDocument(document);
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Failed to export: ${errorMessage}`);
        }
    }

    private static async convertNotebookToMarkdown(notebook: vscode.NotebookDocument, params: ExportParameters): Promise<string> {
        const { includeMetadata, includeOutput, trimLineCount, exportPath } = params;
        const lines: string[] = [];
    
        for (const cell of notebook.getCells()) {
            const text = cell.document.getText();
            console.log("Cell text:", text);
            if (cell.kind === vscode.NotebookCellKind.Markup) {
                // マークダウンセル
                lines.push(text, "");
            } else if (cell.kind === vscode.NotebookCellKind.Code) {
                // コードセル
                lines.push("```script", text, "```", "");
    
                if (!includeOutput) { continue; }

                const commandId = cell.metadata?.id;
                if (!commandId) {
                    throw new Error(`Command id not found in cell`);
                }
                const command = await Command.getById(commandId);
                if (!command) {
                    throw new Error(`Command not found: ${commandId}`);
                }
                const textOutput = this.getOutputText(command.output, trimLineCount);
                // const textOutput = command.output;
                if (textOutput) {
                    lines.push("```text", textOutput, "```", "");
                }
    }
    
            if (includeMetadata && text.startsWith("% ")) {
                lines.push(text.split("\n").filter((line) => line.startsWith("% ")).join("\n"), "");
            }
        }
    
        return lines.join("\n");
    }
    
    private static getCellOutputText(output: vscode.NotebookCellOutput, trimLineCount: number): string | null {
        const textData = output.items.find((item) => item.mime === "text/plain")?.data;
        if (!textData) {return null;}
    
        const text = Buffer.from(textData).toString("utf8");
        return this.getOutputText(text, trimLineCount);
    }

    private static getOutputText(text: string, trimLineCount: number): string | null {
        const lines = text.split("\n");
    
        if (lines.length <= trimLineCount * 2) {
            return text; // No trimming needed
        }
    
        // Trim and show start and end lines
        const startLines = lines.slice(0, trimLineCount);
        const endLines = lines.slice(-trimLineCount);
        return [...startLines, "...", ...endLines].join("\n");
    }

}
