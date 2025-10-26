# PostgreSQL Setup Script for JASON AI Architect

# Ensure running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))  
{  
    Write-Warning "Please run this script as an Administrator!"
    exit
}

# PostgreSQL Installation Parameters
$postgresVersion = "15"
$postgresInstallPath = "C:\Program Files\PostgreSQL\$postgresVersion"
$databaseName = "jason_ai_architect"
$databaseUser = "jason_admin"
$databasePassword = "J@S0n_S3cur3_P@ssw0rd_2024!"

# Download PostgreSQL Installer
$installerUrl = "https://get.enterprisedb.com/postgresql/postgresql-$postgresVersion.3-1-windows-x64.exe"
$installerPath = "$env:TEMP\postgresql-installer.exe"

Write-Host "Downloading PostgreSQL Installer..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

# Silent Installation
Write-Host "Installing PostgreSQL..." -ForegroundColor Green
Start-Process -FilePath $installerPath `
    -ArgumentList "/quiet /passive ADDLOCAL=All CREATESHORTCUTS=1 COMPONENTSDEST=$postgresInstallPath DATADIR=$postgresInstallPath\data SERVICENAME=postgresql-x64-$postgresVersion PASSWORD=$databasePassword" `
    -Wait

# Add PostgreSQL to PATH
$env:Path += ";$postgresInstallPath\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, "Machine")

# Wait for PostgreSQL service to start
Start-Sleep -Seconds 10

# Create Database and User
Write-Host "Creating Database and User..." -ForegroundColor Magenta
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
npx prisma generate
npx prisma migrate dev --name init

Write-Host "PostgreSQL Setup Complete!" -ForegroundColor Green
Write-Host "Database: $databaseName" -ForegroundColor Yellow
Write-Host "User: $databaseUser" -ForegroundColor Yellow
