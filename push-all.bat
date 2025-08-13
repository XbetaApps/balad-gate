


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
echo Last commit on origin/main:
git log origin/main -1 --format="%%h %%an %%ad %%s"

git push --force xbeta main:ameed
if %ERRORLEVEL% NEQ 0 (
    echo Error pushing to xbeta
    exit /b %ERRORLEVEL%
)
echo Last commit on xbeta/ameed:
git log xbeta/ameed -1 --format="%%h %%an %%ad %%s"
echo Done.
pause
