import * as vscode from "vscode";
import { ExportDialog } from "./ExportDialog";
import { Command, CommandRow } from "../model/Command";
import { Logger } from "../Logger";
import * as fs from "fs";

export interface ExportParameters {
    includeMetadata: boolean;
    includeCommandInfo: boolean;
    includeOutput: boolean;
    trimLineCount: number;
    openMarkdown: boolean;
    exportPath: vscode.Uri;
    captionCommandOutput : boolean;
}

export class MarkdownExport {
    public static async exportNotebook(): Promise<void> {
        const notebookEditor = vscode.window.activeNotebookEditor;

        if (!notebookEditor) {
            vscode.window.showErrorMessage("No active notebook editor found.");
            return;
        }

        const notebookName = notebookEditor.notebook.uri.path.split("/").pop() ?? "Untitled";

        const dialog = new ExportDialog(notebookName, 'markdown');
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

    static async convertNotebookToMarkdown(notebook: vscode.NotebookDocument, params: ExportParameters): Promise<string> {
        const lines: string[] = [];
        for (const cell of notebook.getCells()) {
            const text = cell.document.getText();
    
            switch (cell.kind) {
                case vscode.NotebookCellKind.Markup:
                    this.processMarkdownCell(lines, text, params);
                    break;
    
                case vscode.NotebookCellKind.Code:
                    await this.processCodeCell(cell, lines, params);
                    break;
    
                default:
                    vscode.window.showWarningMessage(`Unsupported cell kind: ${cell.kind}`);
            }
    
            // if (params.includeMetadata && text.startsWith("% ")) {
            //     this.addMetadata(lines, text);
            // }
        }
    
        return lines.join("\n");
    }

    private static processMarkdownCell(lines: string[], text: string, params: ExportParameters): void {
        text.split(/\n/).forEach( (line) => {
            if (line.startsWith("% ")) {
                if (params.includeMetadata) {lines.push(line); }
            } else {
                lines.push(line);
            }
        });
        lines.push("");
    }

    private static async processCodeCell(
        cell: vscode.NotebookCell,
        lines: string[],
        params: ExportParameters
    ): Promise<void> {
    
        const commandId = cell.metadata?.id;
    
        if (!commandId) {
            throw new Error(`Command ID not found in the cell metadata`);
        }
    
        const command = await Command.getById(commandId);
        if (!command) {
            throw new Error(`Command not found: ${commandId}`);
        }
    
        // Add command code block with optional command info
        lines.push("```shell");
        if (params.includeCommandInfo) {
            this.addCommandInfo(lines, command);
        }
        lines.push(cell.document.getText());
        lines.push("```", "");
    
        // Optionally include command output
        if (params.includeOutput) {
            // this.addCommandOutput(lines, command, params.trimLineCount);
            this.addCommandOutput(lines, command, params);
        }
    }

    private static addCommandInfo(lines: string[], command: CommandRow): void {
        const startTime = new Date(command.start);
        const endTime = new Date(command.end ?? 0);
        const execDuration = (endTime.getTime() - startTime.getTime()) / 1000;
    
        lines.push(`# Start Time: ${startTime.toLocaleString()}`);
        lines.push(`# Duration: ${execDuration.toFixed(2)}s`);
        lines.push(`# Exit Code: ${command.exit_code}`);
    }
    
    // private static processMarkdownCell(lines: string[], text: string, params: ExportParameters): void {
    private static addCommandOutput(lines: string[], command: CommandRow, params: ExportParameters): void {
        const trimLineCount = params.trimLineCount ?? 5;
        // const captionCommandOutput = params.captionCommandOutput ?? false;
        let outputText = this.getOutputText(command.output, trimLineCount);
    
        if (outputText) {
            if (command.file_operation_mode === 'downloaded') {
                outputText = this.getDownloadContent(outputText);
            }
            if (params.captionCommandOutput) {
                lines.push(`**Command Output:**`);
            }
            lines.push("```text");
            lines.push(outputText, "```", "");
        }
    }

    private static addMetadata(lines: string[], text: string): void {
        const metadataLines = text
            .split("\n")
            .filter((line) => line.startsWith("% "))
            .join("\n");
        if (metadataLines) {
            lines.push(metadataLines, "");
        }
    }
        
    static getDownloadContent(documentText: string) : string {
        const fileUrlMatch = documentText.match(/\[.*?\]\((file:\/\/.*?)\)/);
        if (!fileUrlMatch) {
            return 'No file URL found in the document.';
        }
        const fileUrl = fileUrlMatch[1];
        let filePath = decodeURIComponent(fileUrl.replace('file://', ''));
        if (process.platform === 'win32' && filePath.startsWith('/')) {
            filePath = filePath.slice(1); // Remove the leading slash on Windows paths
        }
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            return String(error);
        }
    }

    public static getOutputText(text: string, trimLineCount: number): string | null {
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
