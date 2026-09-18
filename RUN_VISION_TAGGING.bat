@echo off
setlocal
cd /d "%~dp0"
title Pieceful Vision Tagging v0

echo.
echo ========================================
echo   Pieceful Vision Tagging v0
echo ========================================
echo.

if not exist "tools\content_tagging\tag_vision.ps1" (
  echo ERROR: tools\content_tagging\tag_vision.ps1 was not found.
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
    echo.
    pause
    exit /b 1
  )
)

echo Authoring-time only. No runtime AI is added to Pieceful.
echo Uses the latest complete local manifest and existing local images.
echo No Python installation is required.
echo.

"%PS_CMD%" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "tools\content_tagging\tag_vision.ps1"
set "TAG_EXIT=%errorlevel%"

echo.
if "%TAG_EXIT%"=="4" (
  echo PARTIAL: checkpoint saved. Double-click again to resume.
  echo.
  pause
  exit /b 4
)
if not "%TAG_EXIT%"=="0" (
  echo FAILED: Vision tagging exited with code %TAG_EXIT%.
  echo Keep this window open and send the error text to Sophira.
  echo.
  pause
  exit /b %TAG_EXIT%
)

echo SUCCESS: Vision tagging finished.
echo Results are under:
echo   .pieceful-content\tagging
echo.

if exist ".pieceful-content\tagging" start "" explorer ".pieceful-content\tagging"

pause
exit /b 0
