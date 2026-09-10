@echo off
cd /d "%~dp0backend"
if not exist node_modules (
  echo Installing backend packages...
  call npm install
)
echo Starting Event Nest backend...
call npm start
pause
