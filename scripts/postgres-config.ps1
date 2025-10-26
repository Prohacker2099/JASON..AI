# PostgreSQL Configuration Script for JASON AI Architect

# Ensure running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))  
{  
    Write-Warning "Please run this script as an Administrator!"
    exit
}

# PostgreSQL Configuration Parameters
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

# Modify PostgreSQL Configuration Files
function Update-PostgresConfig {
    try {
        # Modify pg_hba.conf for local connections
        $pgHbaPath = "$postgresDataPath\pg_hba.conf"
        $pgHbaContent = Get-Content $pgHbaPath
        $modifiedPgHbaContent = $pgHbaContent -replace 'METHOD\s+md5', 'METHOD        trust'
        $modifiedPgHbaContent | Set-Content $pgHbaPath

        # Modify postgresql.conf
        $postgresConfPath = "$postgresDataPath\postgresql.conf"
        $postgresConfContent = Get-Content $postgresConfPath
        $modifiedPostgresConfContent = $postgresConfContent -replace '#listen_addresses = ', 'listen_addresses = ''*'''
        $modifiedPostgresConfContent | Set-Content $postgresConfPath

        Write-Log "PostgreSQL configuration updated successfully" Green
    } catch {
        Write-Log "Error updating PostgreSQL configuration: $_" Red
        exit
    }
}

# Reset PostgreSQL Service
function Reset-PostgresService {
    try {
        # Stop PostgreSQL service
        Stop-Service -Name "postgresql-x64-$postgresVersion" -Force
        Start-Sleep -Seconds 3

        # Start PostgreSQL service
        Start-Service -Name "postgresql-x64-$postgresVersion"
        Start-Sleep -Seconds 5

        Write-Log "PostgreSQL service reset successfully" Green
    } catch {
        Write-Log "Error resetting PostgreSQL service: $_" Red
        exit
    }
}

# Create Database and User
function Initialize-JasonDatabase {
    try {
        # Set PostgreSQL bin path
        $env:Path += ";$postgresInstallPath\bin"

        # Create database
        & "$postgresInstallPath\bin\psql" -U postgres -c "CREATE DATABASE $databaseName;"
        
        # Create user
        & "$postgresInstallPath\bin\psql" -U postgres -c "CREATE USER $databaseUser WITH PASSWORD '$databasePassword';"
        
        # Grant privileges
        & "$postgresInstallPath\bin\psql" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $databaseName TO $databaseUser;"

        Write-Log "Database and user created successfully" Green
    } catch {
        Write-Log "Error creating database and user: $_" Red
        exit
    }
}

# Update Environment Configuration
function Update-EnvironmentConfig {
    try {
        # Generate secure JWT secret
        $jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

        # Create .env file
        $envContent = @"
DATABASE_URL='postgresql://$databaseUser`:$databasePassword@localhost:5432/$databaseName?schema=public'
PORT=3001
JWT_SECRET=$jwtSecret
"@

        $envContent | Out-File -FilePath .env -Encoding UTF8

        Write-Log "Environment configuration updated" Green
    } catch {
        Write-Log "Error updating environment configuration: $_" Red
        exit
    }
}

# Main Execution
try {
    Write-Log "Starting JASON AI Architect PostgreSQL Configuration" Cyan
    
    Update-PostgresConfig
    Reset-PostgresService
    Initialize-JasonDatabase
    Update-EnvironmentConfig

    # Run Prisma setup
    npx prisma generate
    npx prisma migrate dev --name init

    Write-Log "JASON AI Architect PostgreSQL Setup Complete!" Green
} catch {
    Write-Log "Fatal error during PostgreSQL setup: $_" Red
    exit
}
