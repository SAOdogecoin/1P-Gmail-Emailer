@echo off
echo.
echo [ 1P Gmail Emailer - Updater ]
echo ════════════════════════════════════════
echo.
echo Pulling latest code from Git...
git pull origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Git pull failed. Please check your internet or repo setup.
) else (
    echo.
    echo [SUCCESS] Code updated. 
    echo.
    echo NEXT STEPS:
    echo 1. Open chrome://extensions in your browser.
    echo 2. Find "1P Gmail Emailer" card.
    echo 3. Click the Reload icon (circular arrow).
    echo 4. If new carriers were added to the defaults, click "Sync" in Settings.
)
echo.
pause
