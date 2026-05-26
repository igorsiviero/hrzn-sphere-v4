@echo off
set "ROOT=%~dp0"
cd /d "%ROOT%"

rem Workspace local por padrão. Se quiser usar outro caminho, altere a linha abaixo:
set "WORKSPACE_DIR=%ROOT%workspace"

if not exist "node_modules" (
  echo Instalando dependencias do projeto...
  call npm install
)

start "HRZN Sphere" cmd /k npm start

timeout /t 2 >nul
start "" http://localhost:3000
