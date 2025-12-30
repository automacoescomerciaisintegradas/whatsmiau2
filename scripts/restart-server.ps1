# Kill all Go processes and restart server
Write-Host "Stopping all Go processes..." -ForegroundColor Yellow
taskkill /F /IM go.exe 2>$null
taskkill /F /IM main.exe 2>$null

Start-Sleep -Seconds 2

Write-Host "Starting server..." -ForegroundColor Cyan
go run main.go
