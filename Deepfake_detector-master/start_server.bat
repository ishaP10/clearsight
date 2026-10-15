@echo off
title ClearSight — Media Integrity Platform
echo ========================================================
echo  Launching ClearSight Forensics ^& Restoration Server
echo  Server Address: http://127.0.0.1:5002
echo ========================================================
py -3.12 app.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Trying fallback python launcher...
    python app.py
)
pause
