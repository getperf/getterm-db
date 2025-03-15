Set objShell = CreateObject("WScript.Shell")
objShell.Run "cmd /c code-insiders.cmd . --enable-proposed-api getperf.getterm-db", 0, False
