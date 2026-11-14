@echo off
cd /d "%~dp0"
echo Iniciando Atencion Ciudadana...
echo Abre http://127.0.0.1:5173 en tu navegador.
call npm run dev
pause
