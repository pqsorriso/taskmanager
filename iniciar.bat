@echo off
title FCEUX Task Manager v2.6.6
echo.
echo  ========================================
echo    FCEUX Task Manager v2.6.6
echo    Servidor local iniciando na porta 8000
echo  ========================================
echo.
echo  NAO FECHE ESTA JANELA enquanto usar o app!
echo  Para encerrar, feche esta janela.
echo.

cd /d "%~dp0"

:: Abre o navegador após 2 segundos (tempo pro servidor subir)
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000/index.html"

:: Inicia o servidor
python -m http.server 8000