# JASON AI Architect - PostgreSQL Troubleshooting Script

# Ensure running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))  
{  
    Write-Warning "Please run this script as an Administrator!"
    exit
}

# PostgreSQL Configuration
$postgresVersion = "15"
$postgresInstallPath = "C:\Program Files\PostgreSQL\$postgresVersion"
$postgresDataPath = "$postgresInstallPath\data"
$postgresPassword = "JasonAI2024!"
$databaseName = "jason_ai_architect"
$databaseUser = "jason_admin"

# Logging function
function Write-Log($Message, $Color = 'Green') {
    Write-Host $Message -ForegroundColor $Color
}

# Comprehensive Troubleshooting Steps
function Troubleshoot-PostgreSQL {
    try {
        # Stop PostgreSQL Service
        Write-Log "Stopping PostgreSQL Service..." Yellow
        Stop-Service -Name "postgresql-x64-$postgresVersion" -Force

        # Reset Configuration Files
        Write-Log "Resetting PostgreSQL Configuration..." Cyan
        
        # Modify pg_hba.conf for local connections
        $pgHbaPath = "$postgresDataPath\pg_hba.conf"
        $pgHbaContent = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                trust
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
"@
        $pgHbaContent | Set-Content $pgHbaPath

        # Modify postgresql.conf
        $postgresConfPath = "$postgresDataPath\postgresql.conf"
        $postgresConfContent = Get-Content $postgresConfPath
        $modifiedPostgresConfContent = $postgresConfContent -replace '#listen_addresses = ', 'listen_addresses = ''*'''
        $modifiedPostgresConfContent | Set-Content $postgresConfPath

        # Create Password Reset Script
        @"
ALTER ROLE postgres WITH PASSWORD '$postgresPassword';
"@ | Out-File -FilePath "$postgresDataPath\reset_password.sql" -Encoding UTF8

        # Start PostgreSQL in Single-User Mode
        Write-Log "Starting PostgreSQL in Single-User Mode..." Magenta
        & "$postgresInstallPath\bin\pg_ctl" -D "$postgresDataPath" start -o "-c listen_addresses='' -c single_user=true"

        # Apply Password Reset
        Write-Log "Resetting Postgres User Password..." Blue
        & "$postgresInstallPath\bin\psql" -f "$postgresDataPath\reset_password.sql"

        # Stop Single-User PostgreSQL
        & "$postgresInstallPath\bin\pg_ctl" -D "$postgresDataPath" stop

        # Restart PostgreSQL Service
        Write-Log "Restarting PostgreSQL Service..." Yellow
        Start-Service -Name "postgresql-x64-$postgresVersion"
        Start-Sleep -Seconds 5

        # Recreate Database and User
        Write-Log "Recreating Database and User..." Cyan
        & "$postgresInstallPath\bin\psql" -U postgres -c "DROP DATABASE IF EXISTS $databaseName;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "DROP USER IF EXISTS $databaseUser;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "CREATE DATABASE $databaseName;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "CREATE USER $databaseUser WITH PASSWORD '$postgresPassword';"
        & "$postgresInstallPath\bin\psql" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $databaseName TO $databaseUser;"

        Write-Log "PostgreSQL Troubleshooting Complete!" Green
    }
    catch {
        Write-Log "Error during PostgreSQL troubleshooting: $_" Red
        exit
    }
}

# Run Troubleshooting
Troubleshoot-PostgreSQL

# Verify Connection
Write-Log "Verifying PostgreSQL Connection..." Magenta
& "$postgresInstallPath\bin\psql" -U postgres -c "\l"

