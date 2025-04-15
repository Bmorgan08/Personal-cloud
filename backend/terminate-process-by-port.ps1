$processes = Get-NetTCPConnection -LocalPort 5050 | Select-Object -ExpandProperty OwningProcess | Select-Object -Unique

foreach ($processId in $processes) {
    $process = Get-WmiObject Win32_Process | Where-Object { $_.ProcessId -eq $processId }

    if ($process.Name -eq "node.exe" -and $process.CommandLine -match "websocket.js") {
        Write-Host "Terminating WebSocket server (PID: $processId)..."
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "Successfully terminated WebSocket server (PID: $processId)."
        } catch {
            Write-Host "Failed to terminate WebSocket server (PID: $processId). Error: $($_.Exception.Message)"
        }
    } else {
        Write-Host "Skipping process $processId ($($process.Name)): Not a WebSocket server."
    }
}
