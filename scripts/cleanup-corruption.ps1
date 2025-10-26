param(
    [string]$Root = "C:\Users\supro\Downloads\JASON_TheOmnipotentAIArchitect"
)

$ErrorActionPreference = 'Stop'

# Create quarantine folder with timestamp
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$Quarantine = Join-Path $Root ("_corrupted_quarantine_$timestamp")
New-Item -Path $Quarantine -ItemType Directory -Force | Out-Null

# Find all corrupted files by markers
$patterns = @(
    "model 'llama2:latest' not found",
    'JASON\.visioneer'
)

$regex = ($patterns -join '|')
$files = Get-ChildItem -LiteralPath $Root -Recurse -File |
    Select-String -Pattern $regex -AllMatches |
    Select-Object -ExpandProperty Path -Unique

Write-Host "Found $($files.Count) corrupted files"

# Move files to quarantine, preserving structure
foreach ($f in $files) {
    $relative = $f.Substring($Root.Length).TrimStart('\\')
    $dest = Join-Path $Quarantine $relative
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Move-Item -LiteralPath $f -Destination $dest -Force
    Write-Host ("Moved: " + $relative)
}

Write-Host "Total moved: $($files.Count)"
Write-Host "Quarantine folder: $Quarantine"

# Verification: ensure no corrupted markers remain in the active tree
$remaining = Get-ChildItem -LiteralPath $Root -Recurse -File |
    Where-Object { $_.FullName -notlike (Join-Path $Quarantine '*') } |
    Select-String -Pattern $regex -AllMatches |
    Select-Object -ExpandProperty Path -Unique

if ($remaining.Count -gt 0) {
    Write-Warning "Some corrupted files remain:"
    $remaining | ForEach-Object { Write-Host $_ }
    exit 2
} else {
    Write-Host "Verification passed: No corrupted markers remain in active tree."
    exit 0
}
