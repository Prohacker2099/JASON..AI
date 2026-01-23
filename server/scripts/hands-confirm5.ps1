$ErrorActionPreference = 'Stop'

$base = 'http://127.0.0.1:3001/api/hands'

function PostJson([string]$url, $obj) {
  return Invoke-RestMethod -Method Post -Uri $url -ContentType 'application/json' -Body ($obj | ConvertTo-Json -Depth 12) -TimeoutSec 60
}

function GetJson([string]$url) {
  return Invoke-RestMethod -Method Get -Uri $url -TimeoutSec 60
}

# Health check
$hc = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3001/api/health' -TimeoutSec 10
if ($hc.StatusCode -ne 200) { throw "health_not_ok_$($hc.StatusCode)" }

# Ensure headed browser once
$ensure = PostJson "$base/browser/ensure" @{ headless = $false }

$results = @()
for ($i = 1; $i -le 5; $i++) {
  $ts = Get-Date -Format 'yyyyMMddHHmmssfff'
  $target = "https://example.com/?hands_confirm3=$i&ts=$ts"

  $row = [ordered]@{ run = $i; target = $target }
  try {
    # Ensure headed persists
    $null = PostJson "$base/browser/ensure" @{ headless = $false }

    $nav = PostJson "$base/browser/navigate" @{ 
      url = $target
      waitUntil = 'domcontentloaded'
      timeoutMs = 30000
      headless = $false
      guard = @{ requireApproval = $false; waitForIdle = $false }
    }

    $st = GetJson "$base/browser/status"

    $shot = PostJson "$base/browser/screenshot" @{ 
      fullPage = $true
      guard = @{ requireApproval = $false; waitForIdle = $false }
    }

    $file = Join-Path (Get-Location) "hands_confirm3_$i.png"
    $bytes = 0

    if ($shot.dataUrl -and $shot.dataUrl.Contains(',')) {
      $b64 = $shot.dataUrl.Split(',')[1]
      [IO.File]::WriteAllBytes($file, [Convert]::FromBase64String($b64))
      $bytes = (Get-Item $file).Length
    }

    $statusUrl = $st.status.url
    $statusTitle = $st.status.title

    $row.status_url = $statusUrl
    $row.status_title = $statusTitle
    $row.url_match = ($statusUrl -eq $target)
    $row.title_nonempty = (-not [string]::IsNullOrWhiteSpace([string]$statusTitle))
    $row.screenshot_file = $file
    $row.screenshot_bytes = $bytes
    $row.ok = $true
  } catch {
    $row.ok = $false
    $row.error = $_.Exception.Message
  }

  $results += [pscustomobject]$row
}

$results | ConvertTo-Json -Depth 8 | Out-File -Encoding utf8 hands_confirm3_results.json
$results | ConvertTo-Json -Depth 8
