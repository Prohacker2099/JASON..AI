# JASON AI Architect - Comprehensive Setup Script

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

# Main Setup Process
function Setup-JasonAIArchitect {
    try {
        # Step 1: PostgreSQL Configuration
        Write-Log "Configuring PostgreSQL..." Cyan
        
        # Stop PostgreSQL Service
        Stop-Service -Name "postgresql-x64-$postgresVersion" -Force

        # Modify pg_hba.conf for trust authentication
        $pgHbaContent = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                trust
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
"@
        $pgHbaContent | Set-Content "$postgresDataPath\pg_hba.conf"

        # Restart PostgreSQL Service
        Start-Service -Name "postgresql-x64-$postgresVersion"
        Start-Sleep -Seconds 5

        # Create Database and User
        & "$postgresInstallPath\bin\psql" -U postgres -c "DROP DATABASE IF EXISTS $databaseName;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "DROP USER IF EXISTS $databaseUser;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "CREATE DATABASE $databaseName;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "CREATE USER $databaseUser WITH PASSWORD '$databasePassword';"
        & "$postgresInstallPath\bin\psql" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $databaseName TO $databaseUser;"

        # Step 2: Project Setup
        Write-Log "Setting up JASON AI Architect project..." Magenta
        
        # Change to project directory
        Set-Location "C:\Users\supro\Downloads\JASON_TheOmnipotentAIArchitect"

        # Clean npm cache and remove node_modules
        npm cache clean --force
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

        # Install dependencies
        npm install

        # Install global tools
        npm install -g prisma tsx typescript

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
        Write-Log "Initializing Prisma..." Blue
        npx prisma generate
        npx prisma migrate dev --name init

        # Step 4: Remove Mock Logic
        Write-Log "Removing Mock Logic..." Red
        npm run remove-mocks

        # Step 5: Build Application
        Write-Log "Building Application..." Green
        npm run build

        # Step 6: Start Application
        Write-Log "Starting JASON AI Architect..." Cyan
        npm run dev
    }
    catch {
        Write-Log "Error during JASON AI Architect setup: $_" Red
        exit
    }
}

# Execute Setup
Setup-JasonAIArchitect

