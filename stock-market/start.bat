@echo off

set PORT=%1
if "%PORT%"=="" set PORT=3000

set INSTANCES=%2
if "%INSTANCES%"=="" set INSTANCES=3

echo Starting application on port %PORT% with %INSTANCES% instances

set PORT=%PORT%
docker-compose up --build --scale api=%INSTANCES%