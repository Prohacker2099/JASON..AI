# JASON AI Architect - Comprehensive Troubleshooting Script

# Ensure running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))  
{  
    Write-Warning "Please run this script as an Administrator!"
    exit
}

# Configuration
$postgresVersion = "15"
$postgresInstallPath = "C:\Program Files\PostgreSQL\$postgresVersion"
$postgresDataPath = "$postgresInstallPath\data"
$databaseName = "jason_ai_architect"
$databaseUser = "jason_admin"
$databasePassword = "JasonAI2024!"

# Logging function
function Write-Log($Message, $Color = 'Green') {
    Write-Host $Message -ForegroundColor $Color
}

# Troubleshooting Steps
function Troubleshoot-JasonAISystem {
    try {
        # Step 1: PostgreSQL Configuration
        Write-Log "Checking PostgreSQL Configuration..." Cyan
        
        # Stop PostgreSQL Service
        Stop-Service -Name "postgresql-x64-$postgresVersion" -Force

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

        # Restart PostgreSQL Service
        Start-Service -Name "postgresql-x64-$postgresVersion"
        Start-Sleep -Seconds 5

        # Recreate Database and User
        Write-Log "Recreating Database and User..." Magenta
        & "$postgresInstallPath\bin\psql" -U postgres -c "DROP DATABASE IF EXISTS $databaseName;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "DROP USER IF EXISTS $databaseUser;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "CREATE DATABASE $databaseName;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "CREATE USER $databaseUser WITH PASSWORD '$databasePassword';"
        & "$postgresInstallPath\bin\psql" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $databaseName TO $databaseUser;"

        # Step 2: Project Setup
        Write-Log "Resetting Project Configuration..." Blue
        
        # Change to project directory
        Set-Location "C:\Users\supro\Downloads\JASON_TheOmnipotentAIArchitect"

        # Clean npm cache and remove node_modules
        npm cache clean --force
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

        # Install dependencies
        npm install

        # Generate .env file
        $jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
        @"
DATABASE_URL='postgresql://$databaseUser`:$databasePassword@localhost:5432/$databaseName?schema=public'
PORT=3001
JWT_SECRET=$jwtSecret
MQTT_BROKER_URL=mqtt://localhost:1883
AI_INSIGHTS_ENABLED=true
"@ | Out-File -FilePath .env -Encoding UTF8

        # Step 3: Prisma Setup
        Write-Log "Resetting Prisma Configuration..." Green
        npx prisma generate
        npx prisma migrate dev --name init

        # Step 4: Remove Mock Logic
        Write-Log "Removing Mock Logic..." Red
        npm run remove-mocks

        # Step 5: Build Application
        Write-Log "Building Application..." Cyan
        npm run build

        # Step 6: Start Application
        Write-Log "Starting JASON AI Architect..." Magenta
        Start-Process npm -ArgumentList "run", "dev" -NoNewWindow

        Write-Log "Troubleshooting Complete! Waiting for application startup..." Green
        Start-Sleep -Seconds 15

        # Verify Application
        Write-Log "Verifying Application Startup..." Blue
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method Get -ErrorAction Stop
        Write-Log "Application Started Successfully: $($response.StatusCode)" Green
    }
    catch {
        Write-Log "Troubleshooting Failed: $_" Red
        exit
    }
}

# Execute Troubleshooting
Troubleshoot-JasonAISystem

