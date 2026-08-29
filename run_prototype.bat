@echo off
echo ========================================================
echo Starting HydroBreach Prototype - End-to-End Environment
echo ========================================================

echo.
echo Starting FastAPI Backend...
cd backend
start "HydroBreach Backend" cmd /c "python -m uvicorn hydrobreach.api.main:app --host 0.0.0.0 --port 8000"

echo.
echo Starting React Vite Frontend...
cd ../frontend
start "HydroBreach Frontend" cmd /c "npm run dev"

echo.
echo Servers are booting up! 
echo The frontend will be available at: http://localhost:5173
echo The backend API will be available at: http://localhost:8000/docs
echo.
pause
