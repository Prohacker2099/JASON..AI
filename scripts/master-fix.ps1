# JASON AI Architect - Master Fix Script

# Ensure running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))  
{  
    Write-Warning "Please run this script as an Administrator!"
    exit
}

# Comprehensive Configuration
$projectRoot = "C:\Users\supro\Downloads\JASON_TheOmnipotentAIArchitect"
$postgresVersion = "15"
$postgresInstallPath = "C:\Program Files\PostgreSQL\$postgresVersion"
$postgresDataPath = "$postgresInstallPath\data"
$databaseName = "jason_ai_architect"
$databaseUser = "jason_admin"
$databasePassword = "JasonAI2024!"

# Logging Function
function Write-Log($Message, $Color = 'Green') {
    Write-Host $Message -ForegroundColor $Color
}

# Comprehensive Fix Process
function Repair-JasonAIArchitect {
    try {
        # Step 1: System Preparation
        Write-Log "🔧 Preparing System for Comprehensive Repair..." Cyan
        
        # Stop all potentially conflicting services
        Stop-Service -Name "postgresql-x64-$postgresVersion" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "npm" -Force -ErrorAction SilentlyContinue

        # Step 2: PostgreSQL Configuration
        Write-Log "🗄️ Resetting PostgreSQL Configuration..." Magenta
        
        # Modify pg_hba.conf for secure local connections
        $pgHbaPath = "$postgresDataPath\pg_hba.conf"
        $pgHbaContent = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                md5
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
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

        # Step 3: Database Reconstruction
        Write-Log "💾 Reconstructing Database..." Blue
        & "$postgresInstallPath\bin\psql" -U postgres -c "DROP DATABASE IF EXISTS $databaseName;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "DROP USER IF EXISTS $databaseUser;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "CREATE DATABASE $databaseName;"
        & "$postgresInstallPath\bin\psql" -U postgres -c "CREATE USER $databaseUser WITH PASSWORD '$databasePassword';"
        & "$postgresInstallPath\bin\psql" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $databaseName TO $databaseUser;"

        # Step 4: Project Cleanup and Restoration
        Write-Log "🧹 Cleaning and Restoring Project..." Green
        Set-Location $projectRoot

        # Remove potential problematic files and directories
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        Remove-Item -Force .env -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force .prisma -ErrorAction SilentlyContinue

        # Clean npm cache
        npm cache clean --force

        # Step 5: Dependency Reinstallation
        Write-Log "📦 Reinstalling Dependencies..." Yellow
        npm install

        # Install global tools
        npm install -g prisma tsx typescript

        # Step 6: Environment Configuration
        Write-Log "🔐 Generating Secure Environment..." Red
        $jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
        @"
DATABASE_URL='postgresql://$databaseUser`:$databasePassword@localhost:5432/$databaseName?schema=public'
PORT=3001
JWT_SECRET=$jwtSecret
MQTT_BROKER_URL=mqtt://localhost:1883
AI_INSIGHTS_ENABLED=true
PERFORMANCE_MONITORING=true
"@ | Out-File -FilePath .env -Encoding UTF8

        # Step 7: Prisma Database Setup
        Write-Log "🗂️ Initializing Prisma ORM..." Cyan
        npx prisma generate
        npx prisma migrate dev --name init

        # Step 8: Remove Mock Logic
        Write-Log "🤖 Removing Simulated Components..." Magenta
        npm run remove-mocks

        # Step 9: Build Application
        Write-Log "🏗️ Building Application..." Blue
        npm run build

        # Step 10: Start Application
        Write-Log "🚀 Starting JASON AI Architect..." Green
        Start-Process npm -ArgumentList "run", "dev" -NoNewWindow

        # Wait for application startup
        Start-Sleep -Seconds 20

        # Verify Application
        Write-Log "✅ Verifying Application Startup..." White
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method Get -ErrorAction Stop
        Write-Log "Application Successfully Repaired and Started: $($response.StatusCode)" Green

        # Final System Health Check
        Write-Log "🩺 Performing Final System Health Check..." Cyan
        & "$postgresInstallPath\bin\psql" -U postgres -c "\l"
        npx prisma migrate status
    }
    catch {
        Write-Log "❌ Repair Process Failed: $_" Red
        exit
    }
}

# Execute Master Fix
Repair-JasonAIArchitect

