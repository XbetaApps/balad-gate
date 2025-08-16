@echo off

REM 1️⃣ Pull آخر تغييرات من origin/main
git pull origin main --rebase
if %ERRORLEVEL% NEQ 0 (
    echo Fix conflicts first!
    exit /b %ERRORLEVEL%
)

REM 2️⃣ Push على origin/main
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo Error pushing to origin
    exit /b %ERRORLEVEL%
)
echo Last commit on origin/main:
git log origin/main -1 --format="%%h %%an %%ad %%s"

REM 3️⃣ Push على xbeta/ameed
git push --force xbeta main:ameed
if %ERRORLEVEL% NEQ 0 (
    echo Error pushing to xbeta
    exit /b %ERRORLEVEL%
)
echo Last commit on xbeta/ameed:
git log xbeta/ameed -1 --format="%%h %%an %%ad %%s"

echo Done.
pause
