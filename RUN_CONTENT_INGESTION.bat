@echo off
setlocal
cd /d "%~dp0"
title Pieceful Content Ingestion

echo.
echo ========================================
echo   Pieceful Content Ingestion
echo ========================================
echo.

if not exist "tools\content_ingestion\ingest.py" (
  echo ERROR: tools\content_ingestion\ingest.py was not found.
  echo Make sure this file is inside the Pieceful repo.
  echo.
  pause
  exit /b 1
)

set "PY_CMD="

where py >nul 2>nul
if %errorlevel%==0 (
  set "PY_CMD=py -3"
) else (
  where python >nul 2>nul
  if %errorlevel%==0 set "PY_CMD=python"
)

if not defined PY_CMD (
  echo ERROR: Python 3 was not found.
  echo Install Python 3, then double-click this file again.
  echo.
  pause
  exit /b 1
)

echo Running Content Ingestion v0...
echo.

%PY_CMD% tools\content_ingestion\ingest.py
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
