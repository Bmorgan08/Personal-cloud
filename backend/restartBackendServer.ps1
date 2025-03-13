# restartBackendServer.ps1
# This script terminates the WebSocket process on port 5050 and restarts it in a new PowerShell window.

$port = 5050

# Terminate WebSocket process
Write-Host "Terminating process on port $port..."
& .\terminate-process-by-port.ps1 -portNumber $port

# Wait a bit before starting the server to ensure port is free
Start-Sleep -Seconds 0.5

# Get all current PowerShell process IDs *before* launching the new one
$existingPIDs = Get-Process -Name "powershell" | Select-Object -ExpandProperty Id

# Start the backend server in a new PowerShell window
Write-Host "Starting backend server in a new PowerShell window..."
$process = Start-Process powershell -ArgumentList "-NoExit", "-Command `"cd $PWD; node websocket.js`"" -WindowStyle Normal -PassThru

# Wait for the new PowerShell window to start
Start-Sleep -Seconds 0.5

# Get the new PowerShell process ID
$newPID = $process.Id

# Close all old PowerShell windows except the new one
$existingPIDs | ForEach-Object {
    if ($_ -ne $newPID) {
        Stop-Process -Id $_ -Force
    }
}

Write-Host "Old PowerShell windows closed. Exiting."

Start-Sleep -seconds 0.5

exit