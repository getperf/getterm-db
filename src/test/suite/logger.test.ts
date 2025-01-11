import * as assert from "assert";
import { Logger, LogLevel } from "../../Logger";

export class MockOutputChannel {
    private lines: string[] = [];

    appendLine(line: string) {
        this.lines.push(line);
    }

    get output() {
        return this.lines.join("\n");
    }

    clear() {
        this.lines = [];
    }
}

suite("Logger Tests", () => {
    let mockOutputChannel: MockOutputChannel;

    suiteSetup(() => {
        mockOutputChannel = new MockOutputChannel();
        Logger.setup(mockOutputChannel as any); // Cast to any to match OutputChannel type
        Logger.setLogLevel(LogLevel.INFO);
    });

    test("INFO log should contain timestamp and level", () => {
        mockOutputChannel.clear();
        Logger.logMessage(LogLevel.INFO, "Test Info Message");

        const output = mockOutputChannel.output;
        const now = new Date();
        const expectedTimestamp = now.toLocaleTimeString();

        assert.ok(
            output.includes(`[${expectedTimestamp}] [INFO] Test Info Message`),
        );
    });

    test("ERROR log should contain timestamp and level", () => {
        mockOutputChannel.clear();
        Logger.logMessage(LogLevel.ERROR, "Test Error Message");

        const output = mockOutputChannel.output;
        const now = new Date();
        const expectedTimestamp = now.toLocaleTimeString();

        assert.ok(
            output.includes(
                `[${expectedTimestamp}] [ERROR] Test Error Message`,
            ),
        );
    });

    test("Logs are output at the specified log level", () => {
        mockOutputChannel.clear();
        Logger.setLogLevel(LogLevel.ERROR);
        Logger.logMessage(LogLevel.DEBUG, "Test Debug Message");
        Logger.logMessage(LogLevel.INFO, "Test Info Message");
        Logger.logMessage(LogLevel.WARN, "Test Warn Message");
        Logger.logMessage(LogLevel.ERROR, "Test Error Message");

        const output = mockOutputChannel.output;
        const now = new Date();
        const expectedTimestamp = now.toLocaleTimeString();

        assert.ok(
            output.includes(
                `[${expectedTimestamp}] [ERROR] Test Error Message`,
            ),
        );
    });
});
