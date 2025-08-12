@echo off
git pull origin main --rebase
if %ERRORLEVEL% NEQ 0 (
    echo Fix conflicts first!
    exit /b %ERRORLEVEL%
)
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo Error pushing to origin
    exit /b %ERRORLEVEL%
)
git push --force xbeta main:ameed
if %ERRORLEVEL% NEQ 0 (
    echo Error pushing to xbeta
    exit /b %ERRORLEVEL%
)
echo Done.
