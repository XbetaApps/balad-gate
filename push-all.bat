@echo off
echo push origin/main...
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo error push origin/main
    exit /b %ERRORLEVEL%
)

echo.
echo force push xbeta/main -> ameed...
git push --force xbeta main:ameed

if %ERRORLEVEL% NEQ 0 (
    echo error push xbeta/ameed
    exit /b %ERRORLEVEL%
)

echo.
echo done all