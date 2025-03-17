@echo off
REM Check if an argument, and navigate to the specified directory
if not "%~1"=="" (
  cd /d "%~1"
  if errorlevel 1 (
      echo Failed to change directory to %~1
      exit /b 1
  )
)

REM Run the command
code-insiders.cmd --enable-proposed-api getperf.getterm-db

if errorlevel 1 (
    echo Failed to execute code-insiders.cmd
    exit /b 1
)

exit /b 0
