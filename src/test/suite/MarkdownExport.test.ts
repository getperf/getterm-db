import * as vscode from "vscode";
import * as sinon from "sinon";
import { MarkdownExport } from "../../exporter/MarkdownExport";
import { Command } from "../../model/Command";
import assert from "assert";

suite("MarkdownExport.convertNotebookToMarkdown", () => {
    const sandbox = sinon.createSandbox();
    const commandStartLabel = "2025-01-18T12:00:00Z";
    const commandEndLabel = "2025-01-18T12:00:10Z";

    const mockNotebook1: vscode.NotebookDocument = {
        getCells: () => [
            {
                kind: vscode.NotebookCellKind.Markup,
                document: {
                    getText: () => "### Markdown Header\nMarkdown content",
                },
            },
            {
                kind: vscode.NotebookCellKind.Code,
                metadata: { id: 1 },
                document: {
                    getText: () => "echo 'Hello, World!'",
                },
            },
        ],
    } as unknown as vscode.NotebookDocument;

    const mockNotebook2: vscode.NotebookDocument = {
        getCells: () => [
            {
                kind: vscode.NotebookCellKind.Markup,
                document: {
                    getText: () => 
                        "% sessionId: \"132\"\n% sessionMode: \"start\"\n% currentTime: \"1/18/2025, 3:29:26 PM\"\n" +
                        "# Simple Markdown\nThis is a simple markdown cell.",
                },
            },
            {
                kind: vscode.NotebookCellKind.Code,
                metadata: { id: 1 },
                document: {
                    getText: () => "ls -l",
                },
            },
        ],
    } as unknown as vscode.NotebookDocument;

    suiteSetup(() => {
        // Mock Command.getById
        sandbox.stub(Command, "getById").callsFake(async (id: number) => {
            if (id === 1) {
                return {
                    id: 1,
                    start: commandStartLabel,
                    end: commandEndLabel,
                    exit_code: 0,
                    output: "Command output line 1\nCommand output line 2\nCommand output line 3",
                    file_operation_mode: null,
                };
            }
            return null;
        });
    });

    suiteTeardown(() => {
        sandbox.restore();
    });

    test("should export a notebook with markdown and code cells", async () => {
        // Mock export parameters
        const params = {
            includeMetadata: false,
            includeCommandInfo: true,
            includeOutput: true,
            trimLineCount: 2,
            exportPath: vscode.Uri.file("/mock/path/output.md"),
            openMarkdown: false,
        };

        // Run the method
        const result = await MarkdownExport.convertNotebookToMarkdown(mockNotebook1, params);

        const utcStart = new Date(commandStartLabel); // UTC 時間文字列を Date オブジェクトに変換
        const localStart =  utcStart.toLocaleString(); // ローカルタイムでフォーマット
    
        // Define expected output using a heredoc format
        const expectedOutput = `
### Markdown Header
Markdown content

\`\`\`shell
# Start Time: ${localStart}
# Duration: 10.00s
# Exit Code: 0
echo 'Hello, World!'
\`\`\`

\`\`\`text
Command output line 1
Command output line 2
Command output line 3
\`\`\`
`;

        // Assert the result
        assert.strictEqual(result.trim(), expectedOutput.trim());
    });

    test("should export a notebook with markdown and code cells without includeCommandInfo", async () => {
        const params = {
            includeMetadata: false,
            includeCommandInfo: false,
            includeOutput: true,
            trimLineCount: 2,
            exportPath: vscode.Uri.file("/mock/path/output.md"),
            openMarkdown: false,
        };

        const result = await MarkdownExport.convertNotebookToMarkdown(mockNotebook1, params);
        const expectedOutput = `
### Markdown Header
Markdown content

\`\`\`shell
echo 'Hello, World!'
\`\`\`

\`\`\`text
Command output line 1
Command output line 2
Command output line 3
\`\`\`
`;
        // console.log("expectedOutput:", result);
        // Assert the result
        assert.strictEqual(result.trim(), expectedOutput.trim());
    });

    test("should export a notebook with markdown and code cells without includeOutput", async () => {
        const params = {
            includeMetadata: false,
            includeCommandInfo: false,
            includeOutput: false,
            trimLineCount: 2,
            exportPath: vscode.Uri.file("/mock/path/output.md"),
            openMarkdown: false,
        };

        const result = await MarkdownExport.convertNotebookToMarkdown(mockNotebook1, params);
        const expectedOutput = `
### Markdown Header
Markdown content

\`\`\`shell
echo 'Hello, World!'
\`\`\`
`;
        // console.log("expectedOutput:", result);
        assert.strictEqual(result.trim(), expectedOutput.trim());
    });

    test("should export a notebook with markdown and code cells with trimming", async () => {
        const params = {
            includeMetadata: false,
            includeCommandInfo: false,
            includeOutput: true,
            trimLineCount: 1,
            exportPath: vscode.Uri.file("/mock/path/output.md"),
            openMarkdown: false,
        };

        const result = await MarkdownExport.convertNotebookToMarkdown(mockNotebook1, params);
        const expectedOutput = `
### Markdown Header
Markdown content

\`\`\`shell
echo 'Hello, World!'
\`\`\`

\`\`\`text
Command output line 1
...
Command output line 3
\`\`\`
`;
        console.log("expectedOutput:", result);
        assert.strictEqual(result.trim(), expectedOutput.trim());
    });

    test("should handle a notebook with metadata", async () => {
        const params = {
            includeMetadata: true,
            includeCommandInfo: false,
            includeOutput: false,
            trimLineCount: 0,
            exportPath: vscode.Uri.file("/mock/path/output.md"),
            openMarkdown: false,
        };

        const result = await MarkdownExport.convertNotebookToMarkdown(mockNotebook2, params);

        const expectedOutput = `
% sessionId: "132"
% sessionMode: "start"
% currentTime: "1/18/2025, 3:29:26 PM"
# Simple Markdown
This is a simple markdown cell.

\`\`\`shell
ls -l
\`\`\``;
        // console.log("Result:", result);
        assert.strictEqual(result.trim(), expectedOutput.trim());
    });

    test("should handle a notebook without metadata", async () => {
        const params = {
            includeMetadata: false,
            includeCommandInfo: false,
            includeOutput: false,
            trimLineCount: 0,
            exportPath: vscode.Uri.file("/mock/path/output.md"),
            openMarkdown: false,
        };

        const result = await MarkdownExport.convertNotebookToMarkdown(mockNotebook2, params);

        const expectedOutput = `
# Simple Markdown
This is a simple markdown cell.

\`\`\`shell
ls -l
\`\`\``;
        console.log("Result:", result);
        assert.strictEqual(result.trim(), expectedOutput.trim());
    });

});

