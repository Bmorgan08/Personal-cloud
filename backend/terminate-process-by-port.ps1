# Find all processes using port 5050
$processes = Get-NetTCPConnection -LocalPort 5050 | Select-Object -ExpandProperty OwningProcess | Select-Object -Unique

foreach ($processId in $processes) {  # Renamed from $pid to $processId
    # Get process details
    $process = Get-WmiObject Win32_Process | Where-Object { $_.ProcessId -eq $processId }

    # Check if it's the WebSocket server (node.exe running websocket.js)
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
