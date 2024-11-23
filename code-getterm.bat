@echo off
REM Check if an argument is provided
if "%~1"=="" (
  echo Usage: code-getterm.cmd [directory]
  exit /b
)

REM Navigate to the specified directory
cd /d "%~1"
if errorlevel 1 (
    echo Failed to change directory to %~1
    exit /b 1
)

REM Run the command
code-insiders.cmd . --enable-proposed-api undefined_publisher.getterm-db
if errorlevel 1 (
    echo Failed to execute code-insiders.cmd
    exit /b 1
)

exit /b 0
