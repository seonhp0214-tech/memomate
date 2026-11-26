@echo off
cd /d "%~dp0"
rem 1) start the server (serve.ps1) in a minimized window
start "Memomate-Server" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
rem 2) wait 2 seconds for the server
timeout /t 2 /nobreak >nul
rem 3) open the memo app in the browser
start "" http://localhost:5000
