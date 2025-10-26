# JASON AI Architect - Comprehensive PostgreSQL and Application Setup

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

# Stop PostgreSQL Service
Write-Log "Stopping PostgreSQL Service..." Yellow
Stop-Service -Name "postgresql-x64-$postgresVersion" -Force -ErrorAction SilentlyContinue

# Create Password Reset Script
Write-Log "Preparing Password Reset..." Cyan
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

# Modify pg_hba.conf for Local Trust Authentication
Write-Log "Configuring PostgreSQL Authentication..." Green
$pgHbaPath = "$postgresDataPath\pg_hba.conf"
$pgHbaContent = Get-Content $pgHbaPath
$modifiedPgHbaContent = $pgHbaContent -replace 'METHOD\s+md5', 'METHOD        trust'
$modifiedPgHbaContent | Set-Content $pgHbaPath

# Restart PostgreSQL Service
Write-Log "Restarting PostgreSQL Service..." Yellow
Start-Service -Name "postgresql-x64-$postgresVersion"
Start-Sleep -Seconds 5

# Create Database and User
Write-Log "Creating Database and User..." Cyan
& "$postgresInstallPath\bin\psql" -U postgres -c "CREATE DATABASE $databaseName;"
& "$postgresInstallPath\bin\psql" -U postgres -c "CREATE USER $databaseUser WITH PASSWORD '$postgresPassword';"
& "$postgresInstallPath\bin\psql" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $databaseName TO $databaseUser;"

# Generate Secure .env File
Write-Log "Generating Environment Configuration..." Green
$jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
@"
DATABASE_URL='postgresql://$databaseUser`:$postgresPassword@localhost:5432/$databaseName?schema=public'
PORT=3001
JWT_SECRET=$jwtSecret
MQTT_BROKER_URL=mqtt://localhost:1883
AI_INSIGHTS_ENABLED=true
"@ | Out-File -FilePath .env -Encoding UTF8

# Change to Project Directory
Set-Location "C:\Users\supro\Downloads\JASON_TheOmnipotentAIArchitect"

# Clean and Reinstall Dependencies
Write-Log "Cleaning and Reinstalling Dependencies..." Magenta
npm cache clean --force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install

# Install Global Tools
npm install -g prisma tsx typescript

# Generate Prisma Client
Write-Log "Initializing Prisma..." Blue
npx prisma generate
npx prisma migrate dev --name init

# Remove Mock Logic
Write-Log "Removing Mock Logic..." Red
npm run remove-mocks

# Build Application
Write-Log "Building Application..." Green
npm run build

# Start Application
Write-Log "Starting JASON AI Architect..." Cyan
npm run dev

