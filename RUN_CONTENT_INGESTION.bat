@echo off
setlocal
cd /d "%~dp0"
title Pieceful Content Ingestion

echo.
echo ========================================
echo   Pieceful Content Ingestion
echo ========================================
echo.

if not exist "tools\content_ingestion\ingest.ps1" (
  echo ERROR: tools\content_ingestion\ingest.ps1 was not found.
  echo Run git pull, then double-click this file again.
  echo.
  pause
  exit /b 1
)

set "PS_CMD=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS_CMD%" (
  where pwsh >nul 2>nul
  if %errorlevel%==0 (
    set "PS_CMD=pwsh"
  ) else (
    echo ERROR: PowerShell was not found.
    echo This Windows installation is missing the built-in PowerShell runtime.
    echo.
    pause
    exit /b 1
  )
)

echo Running Content Ingestion v0...
echo No Python installation is required.
echo.

"%PS_CMD%" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "tools\content_ingestion\ingest.ps1"
set "INGEST_EXIT=%errorlevel%"

echo.
if not "%INGEST_EXIT%"=="0" (
  echo FAILED: Content ingestion exited with code %INGEST_EXIT%.
  echo Keep this window open and send the error text to Sophira.
  echo.
  pause
  exit /b %INGEST_EXIT%
)

echo SUCCESS: Content ingestion finished.
echo Images and manifests are under:
echo   .pieceful-content
echo.

if exist ".pieceful-content" start "" explorer ".pieceful-content"

pause
exit /b 0
