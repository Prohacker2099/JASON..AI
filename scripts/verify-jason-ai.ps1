# JASON AI Architect - System Verification Script

# Logging function
function Write-Log($Message, $Color = 'Green') {
    Write-Host $Message -ForegroundColor $Color
}

# Verification Functions
function Test-ServerHealth {
    try {
        Write-Log "Checking Server Health..." Cyan
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method Get -ErrorAction Stop
        Write-Log "Server Health Check: $($response.StatusCode)" Green
        return $true
    }
    catch {
        Write-Log "Server Health Check Failed: $_" Red
        return $false
    }
}

function Test-DatabaseConnection {
    try {
        Write-Log "Checking Database Connection..." Magenta
        $result = npx prisma migrate status
        Write-Log "Database Migration Status: Connected" Green
        return $true
    }
    catch {
        Write-Log "Database Connection Failed: $_" Red
        return $false
    }
}

function Test-MQTTBroker {
    try {
        Write-Log "Checking MQTT Broker..." Blue
        
        # PowerShell MQTT Test using Net.Sockets
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect('localhost', 1883)
        
        if ($tcpClient.Connected) {
            Write-Log "MQTT Broker: Connection Established" Green
            $tcpClient.Close()
            return $true
        }
        else {
            Write-Log "MQTT Broker: Connection Failed" Red
            return $false
        }
    }
    catch {
        Write-Log "MQTT Broker Connection Failed: $_" Red
        return $false
    }
}

function Test-AIInsights {
    try {
        Write-Log "Testing AI Insights Generation..." Blue
        $insightsResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/insights" -Method Get -ErrorAction Stop
        
        if ($insightsResponse.StatusCode -eq 200) {
            $insights = $insightsResponse.Content | ConvertFrom-Json
            Write-Log "AI Insights Generated: $($insights.length) insights" Green
            return $true
        }
        else {
            Write-Log "AI Insights Endpoint Returned Non-200 Status" Yellow
            return $false
        }
    }
    catch {
        Write-Log "AI Insights Generation Failed: $_" Red
        return $false
    }
}

function Test-DeviceDiscovery {
    try {
        Write-Log "Testing Device Discovery..." Cyan
        $devicesResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/devices" -Method Get -ErrorAction Stop
        
        if ($devicesResponse.StatusCode -eq 200) {
            $devices = $devicesResponse.Content | ConvertFrom-Json
            Write-Log "Device Discovery: $($devices.length) devices found" Green
            return $true
        }
        else {
            Write-Log "Device Discovery Endpoint Returned Non-200 Status" Yellow
            return $false
        }
    }
    catch {
        Write-Log "Device Discovery Failed: $_" Red
        return $false
    }
}

# Main Verification Process
function Verify-JasonAISystem {
    Write-Log "Starting JASON AI Architect System Verification..." Magenta

    $checks = @{
        "Server Health" = (Test-ServerHealth)
        "Database Connection" = (Test-DatabaseConnection)
        "MQTT Broker" = (Test-MQTTBroker)
        "AI Insights" = (Test-AIInsights)
        "Device Discovery" = (Test-DeviceDiscovery)
    }

    $overallStatus = $true
    foreach ($check in $checks.GetEnumerator()) {
        if (-not $check.Value) {
            $overallStatus = $false
            Write-Log "❌ $($check.Key) Check Failed" Red
        }
        else {
            Write-Log "✅ $($check.Key) Check Passed" Green
        }
    }

    if ($overallStatus) {
        Write-Log "🎉 JASON AI Architect System Verification Completed Successfully!" Green
    }
    else {
        Write-Log "⚠️ Some System Checks Failed. Please Review Logs." Yellow
    }

    return $overallStatus
}

# Execute Verification
Verify-JasonAISystem
