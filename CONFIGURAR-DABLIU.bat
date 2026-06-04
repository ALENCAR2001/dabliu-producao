@echo off
chcp 65001 >nul 2>nul
cd /d "%~dp0"
title DABLIU - Configurar
color 0A

echo.
echo  ========================================
echo    DABLIU - Configurar Supabase
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo  ERRO: Node.js nao encontrado.
  echo  Instale em https://nodejs.org e rode este arquivo de novo.
  echo.
  pause
  exit /b 1
)

node scripts\configurar-supabase.mjs
set ERR=%ERRORLEVEL%

echo.
if %ERR% neq 0 (
  echo  Terminou com erro. Leia a mensagem acima.
) else (
  echo  Concluido! Agora: npm run dev
)
echo.
pause
exit /b %ERR%
