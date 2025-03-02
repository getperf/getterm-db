import * as vscode from 'vscode';
import * as sshConfig from 'ssh-config';
import path from 'path';
import * as fs from 'fs/promises';

/**
 * SSH の Host エントリーを表す TreeItem
 */
export class SSHHostTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly configEntry: sshConfig.ConfigEntry,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(label, collapsibleState);
        this.tooltip = `${label}`;
        this.description = configEntry.value; // 必要に応じて詳細情報を設定
        // アイコンの設定も可能（例: vscode.ThemeIcon を使用）
        this.iconPath = new vscode.ThemeIcon('server');
    }
}

/**
 * SSH Config のパース結果から接続ホストの TreeDataProvider を実装
 */
export class SSHConfigProvider implements vscode.TreeDataProvider<SSHHostTreeItem> {
    private context: vscode.ExtensionContext;
    private sshConfigContent: string = '';

    private _onDidChangeTreeData = new vscode.EventEmitter<SSHHostTreeItem | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(
        context: vscode.ExtensionContext,
        sshConfigContent?: string,
    ) {
        this.context = context;
        this.sshConfigContent = sshConfigContent || '';
        this.registerCommands(context);
    }
    
    private registerCommands(context: vscode.ExtensionContext) {
        this.showSSHConfigTreeView(context);
        context.subscriptions.push(
            vscode.commands.registerCommand('getterm-db.showSSHConfigTreeView', () => {
                this.showSSHConfigTreeView(context);
            }),
            vscode.commands.registerCommand('getterm-db.editSSHConfig', async () => {
                this.editSSHConfig(context);
            })
        );
    }

    async editSSHConfig(context: vscode.ExtensionContext) {
        const userProfile = process.env.USERPROFILE || '';
        const configPath = vscode.Uri.file(path.join(userProfile, '.ssh', 'config'));
        try {
            await vscode.workspace.fs.stat(configPath);
        } catch {
            const templatePath = path.join(context.extensionPath, 'assets', 'ssh_config_template');
            try {
                const template = await fs.readFile(templatePath, 'utf8');
                await vscode.workspace.fs.writeFile(configPath, Buffer.from(template));
            } catch (err) {
                vscode.window.showErrorMessage(`Failed to load the template: ${err}`);
                return;
            }
        }
        const doc = await vscode.workspace.openTextDocument(configPath);
        await vscode.window.showTextDocument(doc);
    }

    showSSHConfigTreeView(context: vscode.ExtensionContext) {
        const configPath = vscode.Uri.file(`${process.env.USERPROFILE}/.ssh/config`);
        vscode.workspace.fs.readFile(configPath).then((data) => {
            const configContent = data.toString();
            this.updateConfigContent(configContent);
            const treeView = vscode.window.createTreeView('sshHosts', {
                treeDataProvider: this,
                showCollapseAll: true
            });
            context.subscriptions.push(treeView);
            context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => {
                console.log(".ssh config file updated:", document.uri.fsPath);
                if (document.uri.fsPath === configPath.fsPath) {
                    vscode.workspace.fs.readFile(configPath).then((newData) => {
                        const updatedContent = newData.toString();
                        this.updateConfigContent(updatedContent);
                        this.refresh();
                    });
                }
            }));
        });
    }

    updateConfigContent(sshConfigContent: string) {
        this.sshConfigContent = sshConfigContent;
    }

    getTreeItem(element: SSHHostTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SSHHostTreeItem): Thenable<SSHHostTreeItem[]> {
        if (!element) {
            const config = sshConfig.parse(this.sshConfigContent);
            const hosts = config.filter((entry: sshConfig.ConfigEntry) => entry.param === 'Host');
            // console.log("HOSTS:", JSON.stringify(hosts));
            const items = hosts.map(
                (host: sshConfig.ConfigEntry) => new SSHHostTreeItem(host.value, host)
            );
            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}
