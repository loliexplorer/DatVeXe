@echo off
chcp 65001 >nul
title EcoBus - Stop all
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-all.ps1" %*
echo.
pause
