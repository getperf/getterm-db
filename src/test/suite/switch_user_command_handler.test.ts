import * as assert from 'assert';
import * as sinon from 'sinon';
import { SwitchUserCommandHandler } from '../../switch_user_command_handler';
import { Command } from '../../model/commands';

suite('SwitchUserCommandHandler Tests', () => {

    // let createStub: sinon.SinonStub;

    // // テストのセットアップ（モックの作成など）
    // setup(() => {
    //     // Command.create メソッドをモックにする
    //     createStub = sinon.stub(Command, 'create');
    // });

    // // テスト終了後、モックを元に戻す
    // teardown(() => {
    //     createStub.restore();
    // });

    // test('Should detect su command and call Command.create', () => {
    //     const handler = new SwitchUserCommandHandler(1, 'sudo su -');

    //     const detected = handler.detectSuCommand();
    //     assert.strictEqual(detected, true, 'su command should be detected');

    //     handler.updateCommand();
    //     assert.ok(createStub.calledOnce, 'Command.create should be called once');
    //     assert.ok(createStub.calledWith(1, 'sudo su -', '', '', 0), 'Command.create should be called with correct arguments');
    // });
});
