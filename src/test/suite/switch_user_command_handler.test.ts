import vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { SwitchUserCommandHandler } from '../../switch_user_command_handler';
import { Command } from '../../model/commands';
import { CommandHandler } from '../../command_handler';

suite('SwitchUserCommandHandler Tests', () => {
    // let commandHandlerMock: CommandHandler;
    let mockTerminal: vscode.Terminal;
    const sessionId = 1;
    setup(() => {
        // Command.create メソッドをモックにする
        // commandHandlerMock = sinon.createStubInstance(CommandHandler);
        mockTerminal = { name: 'Test Terminal' } as unknown as vscode.Terminal;
        sinon.stub(Command, 'create').callsFake(async (sessionId: number, command: string) => {
            return Promise.resolve(1);  // ダミーのコマンドIDを返します
        });
        sinon.stub(Command, 'updateEnd').resolves(); // updateEnd のモック
    });


    teardown(() => {
        // createStub.restore();
        sinon.restore(); // モックを解除
    });

    test('detectSuCommand should return true if su command is detected', async () => {
        const commandBuffer = "pwd\x1b[?25l\x1b[10;20Hsu -\x1b[?25h";
        const handler = new SwitchUserCommandHandler(mockTerminal, sessionId, commandBuffer);
        assert.strictEqual(await handler.detectSuCommand(), true);
    });

    test('detectSuCommand should return false if su command is not detected', async () => {
        const commandBuffer = "pwd\x1b[?25l\x1b[10;20Hecho Hello\x1b[?25h";
        const handler = new SwitchUserCommandHandler(mockTerminal, sessionId, commandBuffer);
        assert.strictEqual(await handler.detectSuCommand(), false);
    });

    test('updateCommand should call Command.create with parsed command', async () => {
        const commandBuffer = "sudo su -";
        const handler = new SwitchUserCommandHandler(mockTerminal, sessionId, commandBuffer);
        const commandId = await handler.updateCommand();

        // モックのアサーション
        assert.strictEqual(commandId, 1);
        sinon.assert.calledOnce(Command.create as sinon.SinonStub);
        sinon.assert.calledOnce(Command.updateEnd as sinon.SinonStub); // updateEnd の呼び出しも確認

    });

});
