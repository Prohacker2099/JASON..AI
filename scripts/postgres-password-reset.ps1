# PostgreSQL Password Reset Script

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
$newPassword = "JasonAI2024!"

# Logging function
function Write-Log($Message, $Color = 'Green') {
    Write-Host $Message -ForegroundColor $Color
}

# Main Password Reset Process
function Reset-PostgresPassword {
    try {
        # Step 1: Backup pg_hba.conf
        Write-Log "Creating backup of pg_hba.conf..." Yellow
        Copy-Item "$postgresDataPath\pg_hba.conf" "$postgresDataPath\pg_hba.conf.bk"

        # Step 2: Modify pg_hba.conf for trust authentication
        Write-Log "Modifying pg_hba.conf for trust authentication..." Cyan
        $pgHbaContent = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                trust
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
"@
        $pgHbaContent | Set-Content "$postgresDataPath\pg_hba.conf"

        # Step 3: Restart PostgreSQL Service
        Write-Log "Stopping PostgreSQL Service..." Magenta
        Stop-Service -Name "postgresql-x64-$postgresVersion" -Force
        Start-Sleep -Seconds 3
        Write-Log "Starting PostgreSQL Service..." Blue
        Start-Service -Name "postgresql-x64-$postgresVersion"
        Start-Sleep -Seconds 5

        # Step 4: Create password reset script
        $resetScriptPath = "$postgresDataPath\reset_password.sql"
        @"
ALTER USER postgres WITH PASSWORD '$newPassword';
"@ | Out-File -FilePath $resetScriptPath -Encoding UTF8

        # Step 5: Connect and reset password
        Write-Log "Resetting postgres user password..." Green
        & "$postgresInstallPath\bin\psql" -U postgres -f $resetScriptPath

        # Step 6: Restore original pg_hba.conf
        Write-Log "Restoring original pg_hba.conf..." Yellow
        Copy-Item "$postgresDataPath\pg_hba.conf.bk" "$postgresDataPath\pg_hba.conf"

        # Restart service again to apply changes
        Stop-Service -Name "postgresql-x64-$postgresVersion" -Force
        Start-Service -Name "postgresql-x64-$postgresVersion"

        # Verify connection
        Write-Log "Verifying PostgreSQL Connection..." Cyan
        & "$postgresInstallPath\bin\psql" -U postgres -c "\l"

        Write-Log "PostgreSQL Password Reset Completed Successfully!" Green
    }
    catch {
        Write-Log "Error during PostgreSQL password reset: $_" Red
        exit
    }
}

# Execute Password Reset
Reset-PostgresPassword

