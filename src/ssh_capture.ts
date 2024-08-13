import * as vscode from 'vscode';
import * as cp from 'child_process';

export class SSHProfileProvider implements vscode.TerminalProfileProvider {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.registerEventHandlers();
    }

	// OSC 633 を解析する関数
	parseOsc633(input: string): Array<{ type: string, payload: string }> {
		// const osc633Pattern = /\x1B\]633;([A-Z]);([^\x1B]+)\x1B\\/g;
		const osc633Pattern = /\x1B\]633;([A-Z]);([^]*)/g;
		const matches = input.matchAll(osc633Pattern);
		const result: Array<{ type: string, payload: string }> = [];

		for (const match of matches) {
			result.push({
				type: match[1],     // メッセージの種類 (A, B, C など)
				payload: match[2]   // メッセージのペイロード
			});
		}

		return result;
	}

    provideTerminalProfile(token: vscode.CancellationToken): vscode.ProviderResult<vscode.TerminalProfile> {
        const terminal = vscode.window.activeTerminal;
        if (!terminal) {
            vscode.window.showErrorMessage('SSH Profile not found');
            return;
        }
        const terminalProfile = terminal.creationOptions;
        let terminalCaptureProfile = JSON.parse(JSON.stringify(terminalProfile));
        terminalCaptureProfile.name = `${terminalProfile.name}(Capture)`;
        console.log("Terminal: ", terminal.creationOptions);
        const remoteHost = terminalCaptureProfile.shellArgs[0];

        let shellIntegrationPath: string | undefined;
        const remotePath = '/tmp/vscode-shell-integration.sh';
        try {
            shellIntegrationPath = cp.execSync('code --locate-shell-integration-path bash').toString().trim();
            cp.execSync(`scp ${shellIntegrationPath} ${remoteHost}:${remotePath}`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to locate shell integration path.');
            return;
        }
        return new vscode.TerminalProfile(terminalCaptureProfile);
    }

    private registerEventHandlers(): void {
        this.context.subscriptions.push(
            vscode.window.onDidChangeTerminalState(() => {
                vscode.window.showInformationMessage('Terminal shell integration changed.');
            })
        );
    }

	async shellIntegrationPostOperation(e: vscode.TerminalShellIntegrationChangeEvent) {
		if (/Capture/.test(e.terminal.name)) {
			try {
				console.log(`Deleted rows from cmds table.`);
			} catch (error) {
				console.error('Error occurred:', error);
			}
		}
	}

	async shellIntegrationStartHandler(e: vscode.TerminalShellExecutionStartEvent) {
    // async shellIntegrationStartHandler(e: vscode.Event.) {
            console.log("START COMMAND");
		const stream = e.execution?.read();
		const buffer: string[] = [];
		for await (const data of stream!) {
			console.log("DATA:", data);
			buffer.push(data);
		}
		// 結果を1つの文字列に結合
		const rawOutput = buffer.join('');
		console.log("RAW OUTPUT:", rawOutput);

        const osc633Messages = this.parseOsc633(rawOutput);
		console.log("OSC 633 解析:", osc633Messages);
	}
}
