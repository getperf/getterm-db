import * as vscode from "vscode";
import { MarkdownExportDialog } from "./MarkdownExportDialog";

export interface ExportParameters {
    includeMetadata: boolean;
    includeOutput: boolean;
    trimLineCount: number;
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
        const result = await dialog.show();
        console.log("export dialog result:", result);
        if (result) {
            vscode.window.showInformationMessage(
                `Exporting notebook "${notebookName}" to "${result.exportPath.fsPath}".`
            );
            this.processExport(result, notebookEditor);
        } else {
            vscode.window.showInformationMessage("Export canceled.");
        }
    }

    private static processExport(params: ExportParameters, notebookEditor: vscode.NotebookEditor): void {
        const exportPath = params.exportPath;
        const content = this.convertNotebookToMarkdown(notebookEditor.notebook, params);

        vscode.workspace.fs.writeFile(exportPath, Buffer.from(content, "utf-8")).then(
            () => vscode.window.showInformationMessage(`Exported to "${exportPath.fsPath}".`),
            (err) => vscode.window.showErrorMessage(`Failed to export: ${err.message}`)
        );
    }

    private static convertNotebookToMarkdown(notebook: vscode.NotebookDocument, params: ExportParameters): string {
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
    
                if (includeOutput && cell.outputs.length > 0) {
                    for (const output of cell.outputs) {
                        const textOutput = this.getOutputText(output, trimLineCount);
                        if (textOutput) {
                            lines.push("```text", textOutput, "```", "");
                        }
                    }
                }
            }
    
            if (includeMetadata && text.startsWith("% ")) {
                lines.push(text.split("\n").filter((line) => line.startsWith("% ")).join("\n"), "");
            }
        }
    
        return lines.join("\n");
    }
    
    private static getOutputText(output: vscode.NotebookCellOutput, trimLineCount: number): string | null {
        const textData = output.items.find((item) => item.mime === "text/plain")?.data;
        if (!textData) {return null;}
    
        const text = Buffer.from(textData).toString("utf8");
        const lines = text.split("\n");
    
        if (lines.length <= trimLineCount * 2) {
            return text; // No trimming needed
        }
    
        // Trim and show start and end lines
        const startLines = lines.slice(0, trimLineCount);
        const endLines = lines.slice(-trimLineCount);
        return [...startLines, "...", ...endLines].join("\n");
    }
    
    // private trimOutput(outputText: string, trimLineCount: number): string {
    //     const lines = outputText.split("\n");
    //     if (lines.length <= trimLineCount * 2) {
    //         return outputText;
    //     }
    //     return [
    //         ...lines.slice(0, trimLineCount),
    //         `... (${lines.length - trimLineCount * 2} lines omitted) ...`,
    //         ...lines.slice(-trimLineCount),
    //     ].join("\n");
    // }
}
