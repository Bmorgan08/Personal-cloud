# restartBackendServer.ps1
# This script terminates the WebSocket process on port 5050 and restarts it in a new PowerShell window.

$port = 5050

# Terminate WebSocket process
Write-Host "Terminating process on port $port..."
& .\terminate-process-by-port.ps1 -portNumber $port

# Wait a bit before starting the server to ensure port is free
Start-Sleep -Seconds 2

# Start the backend server in a NEW PowerShell window
Write-Host "Starting backend server in a new PowerShell window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command `"cd $PWD; node websocket.js`"" -WindowStyle Normal
