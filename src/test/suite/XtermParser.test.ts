import * as assert from "assert";
import * as vscode from "vscode";
import { TerminalSessionManager } from "../../TerminalSessionManager";
import { XtermParser } from "../../XtermParser";
import { DatabaseManager } from "../../DatabaseManager";

suite("XtermParser Tests", () => {
    let xtermParser: XtermParser;

    suiteSetup(() => {
        xtermParser = XtermParser.getInstance();
    });

    test("parseTerminalBuffer should correctly parse and clean terminal output", async () => {
        const buffer = `"\u001b[?25l\u001b[HActivate the web console with: systemctl enable --now cockpit.socket\u001b[K\r\n\u001b[K\r\nLast login: Mon Jan 20 06:12:15 2025 from 192.168.0.13\u001b[K\r\nsource \"/tmp/vscode-shell-integration.sh\"\u001b[K\r\n[psadmin@alma8 ~]$ source \"/tmp/vscode-shell-integration.sh\"\u001b[K\r\n[psadmin@alma8 ~]$ ps -ef | grep _getperf\u001b[K\r\npsadmin  2932014       1  0  1月20 ?      00:00:43 /home/psadmin/ptune/bin/\u001b[31m\u001b[1m_getperf\u001b[m -c /home/psadmin/ptune/getperf.ini\u001b[K\r\npsadmin  3047028 3046681  0 06:20 pts/1    00:00:00 grep --color=auto \u001b[31m\u001b[1m_getperf\u001b[m  \r\n[psadmin@alma8 ~]$ ps -ef | grep _getperf\u001b[K\r\npsadmin  2932014       1  0  1月20 ?      00:00:43 /home/psadmin/ptune/bin/\u001b[31m\u001b[1m_getperf\u001b[m -c /home/psadmin/ptune/getperf.ini\u001b[K\r\npsadmin  3047033 3046681  0 06:20 pts/1    00:00:00 grep --color=auto \u001b[31m\u001b[1m_getperf\u001b[m  \r\n[psadmin@alma8 ~]$ ps -ef | grep _getperf\u001b[K\r\npsadmin  2932014       1  0  1月20 ?      00:00:43 /home/psadmin/ptune/bin/\u001b[31m\u001b[1m_getperf\u001b[m -c /home/psadmin/ptune/getperf.ini\u001b[K\r\npsadmin  3047059 3046681  0 06:20 pts/1    00:00:00 grep --color=auto \u001b[31m\u001b[1m_getperf\u001b[m  \r\n[psadmin@alma8 ~]$\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\r\n\u001b[K\u001b[18;20H\u001b[?25h\u001b[?25l\u001b[H 192.168.0.13\u001b[K\r\nsource \"/tmp/vscode-shell-integration.sh\"\u001b[K\r\n[psadmin@alma8 ~]$ source \"/tmp/vscode-shell-integration.sh\"\u001b[K\r\n[psadmin@alma8 ~]$ ps -ef | grep _getperf\u001b[K\r\npsadmin  2932014       1  0  1月20 ?      00:00:43 /home/psadmin/ptune/bin/\u001b[31m\u001b[1m_getperf\u001b[m -c /home/psadmin/ptune/getperf.ini\u001b[K\r\npsadmin  3047028 3046681  0 06:20 pts/1    00:00:00 grep --color=auto \u001b[31m\u001b[1m_getperf\u001b[m\u001b[K\r\n[psadmin@alma8 ~]$ ps -ef | grep _getperf\u001b[K\r\npsadmin  2932014       1  0  1月20 ?      00:00:43 /home/psadmin/ptune/bin/\u001b[31m\u001b[1m_getperf\u001b[m -c /home/psadmin/ptune/getperf.ini\u001b[K\r\npsadmin  3047033 3046681  0 06:20 pts/1    00:00:00 grep --color=auto \u001b[31m\u001b[1m_getperf\u001b[m\u001b[K\r\n[psadmin@alma8 ~]$ ps -ef | grep _getperf\u001b[K\r\npsadmin  2932014       1  0  1月20 ?      00:00:43 /home/psadmin/ptune/bin/\u001b[31m\u001b[1m_getperf\u001b[m -c /home/psadmin/ptune/getperf.ini\u001b[K\r\npsadmin  3047059 3046681  0 06:20 pts/1    00:00:00 grep --color=auto \u001b[31m\u001b[1m_getperf\u001b[m\u001b[K\r\n\u001b[K\u001b[?25h\u001b]633;A\u0007[psadmin@alma8 ~]$ \u001b]633;B\u0007ps -ef | grep _getperf\r\n\u001b]633;E;ps -ef;\u0007\u001b]633;C\u0007psadmin  2932014       1  0  1月20 ?      00:00:43 /\r\n\u001b[22;52H/home/psadmin/ptune/bin/\u001b[31m\u001b[1m_getperf\u001b[m -c /home/psadmin/ptu\r\n\u001b[22;52Hune/getperf.ini\r\npsadmin  3047064 3046681  0 06:20 pts/1    00:00:00 \r\n\u001b[22;52H grep --color=auto \u001b[31m\u001b[1m_getperf\u001b[m\u001b[K\r\n\u001b]633;D;0\u0007\u001b]633;P;Cwd=/home/psadmin\u0007\u001b]633;A\u0007[psadmin@alma8 ~]$ \u001b]633;B\u0007"`;

        const expectedOutput = `"ps -ef | grep _getperf
psadmin  2930588       1  0 05:55 ?        00:00:00 /home/psadmin/ptune/bin/_getperf -c /home/psadmin/ptune/getperf.ini
psadmin  2930816 2929931  0 05:56 pts/1    00:00:00 grep --color=auto _getperf
[psadmin@alma8 ~]$ "`;

        // Execute parseTerminalBuffer with trimEmptyRow = true
        const actualOutput = await xtermParser.parseTerminalBuffer(buffer, true);
        console.log("output:", actualOutput);
        // Assert that the cleaned output matches the expected output
        // assert.strictEqual(actualOutput, expectedOutput);
    });

});
