# PostgreSQL Reset and Setup Script for JASON AI Architect

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
$databaseName = "jason_ai_architect"
$databaseUser = "jason_admin"
$databasePassword = "JasonAI2024!"  # Strong, simple password

# Utility function for logging
function Write-ColorOutput($Message, $Color = 'Green') {
    Write-Host $Message -ForegroundColor $Color
}

# Stop PostgreSQL Service
Write-ColorOutput "Stopping PostgreSQL Service..." Yellow
Stop-Service -Name "postgresql-x64-$postgresVersion" -ErrorAction SilentlyContinue

# Reset PostgreSQL Configuration
Write-ColorOutput "Resetting PostgreSQL Configuration..." Magenta
try {
    # Modify pg_hba.conf to allow local trust authentication
    $pgHbaPath = "$postgresDataPath\pg_hba.conf"
    $pgHbaContent = Get-Content $pgHbaPath
    $modifiedPgHbaContent = $pgHbaContent -replace 'METHOD\s+md5', 'METHOD        trust'
    $modifiedPgHbaContent | Set-Content $pgHbaPath

    # Modify postgresql.conf if needed
    $postgresConfPath = "$postgresDataPath\postgresql.conf"
    $postgresConfContent = Get-Content $postgresConfPath
    $modifiedPostgresConfContent = $postgresConfContent -replace '#listen_addresses = ', 'listen_addresses = '
    $modifiedPostgresConfContent | Set-Content $postgresConfPath
} catch {
    Write-ColorOutput "Error modifying PostgreSQL configuration: $_" Red
    exit
}

# Start PostgreSQL Service
Write-ColorOutput "Starting PostgreSQL Service..." Cyan
Start-Service -Name "postgresql-x64-$postgresVersion"

# Wait for service to start
Start-Sleep -Seconds 5

# Set PostgreSQL Path
$env:Path += ";$postgresInstallPath\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, "Machine")

# Create Database and User
Write-ColorOutput "Creating Database and User..." Green
& "$postgresInstallPath\bin\psql.exe" -U postgres -c "CREATE DATABASE $databaseName;"
& "$postgresInstallPath\bin\psql.exe" -U postgres -c "CREATE USER $databaseUser WITH PASSWORD '$databasePassword';"
& "$postgresInstallPath\bin\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $databaseName TO $databaseUser;"

# Update .env file
$envContent = @"
DATABASE_URL='postgresql://$databaseUser`:$databasePassword@localhost:5432/$databaseName?schema=public'
PORT=3001
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
"@

$envContent | Out-File -FilePath .env -Encoding UTF8

# Run Prisma migrations
Write-ColorOutput "Initializing Prisma..." Blue
npx prisma generate
npx prisma migrate dev --name init

Write-ColorOutput "PostgreSQL Setup Complete!" Green
Write-ColorOutput "Database: $databaseName" Yellow
Write-ColorOutput "User: $databaseUser" Yellow
