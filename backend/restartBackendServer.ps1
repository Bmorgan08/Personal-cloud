$port = 5050

Write-Host "Terminating process on port $port..."
& .\terminate-process-by-port.ps1 -portNumber $port

Start-Sleep -Seconds 0.5

$existingPIDs = Get-Process -Name "powershell" | Select-Object -ExpandProperty Id

Write-Host "Starting backend server in a new PowerShell window..."
$process = Start-Process powershell -ArgumentList "-NoExit", "-Command `"cd $PWD; node websocket.js`"" -WindowStyle Normal -PassThru

Start-Sleep -Seconds 0.5

$newPID = $process.Id

$existingPIDs | ForEach-Object {
    if ($_ -ne $newPID) {
        Stop-Process -Id $_ -Force
    }
}

Write-Host "Old PowerShell windows closed. Exiting."

Start-Sleep -seconds 0.5

exit