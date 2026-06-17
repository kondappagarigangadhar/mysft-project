<#!
  Rebuild ARRIS-Company-Admin-Documentation.pdf from README.md + modules/*.md
  Requires: Node (npx), Google Chrome at default install path.
#>
$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot
$parts = @(
    'README.md',
    'modules\01-lead-sales.md',
    'modules\02-projects-inventory.md',
    'modules\03-booking-payment.md',
    'modules\04-documents-compliance.md',
    'modules\05-procurement-management.md',
    'modules\06-vendor-management.md',
    'modules\07-supplier-management.md',
    'modules\08-work-orders.md'
)

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# ARRIS Company Admin — Complete Documentation')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('*PDF export — combined from markdown sources in this folder.*')
[void]$sb.AppendLine('')
foreach ($p in $parts) {
    $fp = Join-Path $dir $p
    if (-not (Test-Path -LiteralPath $fp)) { throw "Missing: $fp" }
    [void]$sb.AppendLine((Get-Content -LiteralPath $fp -Raw -Encoding utf8))
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('<hr class="pagebreak" />')
    [void]$sb.AppendLine('')
}

$combined = Join-Path $dir '_pdf-combined.md'
[System.IO.File]::WriteAllText($combined, $sb.ToString(), [System.Text.UTF8Encoding]::new($false))

Push-Location $dir
try {
    npx --yes marked@12.0.2 -i '_pdf-combined.md' -o '_fragment.html' --gfm
    $css = Get-Content -LiteralPath 'pdf-print.css' -Raw -Encoding utf8
    $frag = Get-Content -LiteralPath '_fragment.html' -Raw -Encoding utf8
    $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>ARRIS Company Admin Documentation</title>
<style>
$css
</style>
</head>
<body>
$frag
</body>
</html>
"@
    $htmlPath = Join-Path $dir '_pdf-print.html'
    [System.IO.File]::WriteAllText($htmlPath, $html, [System.Text.UTF8Encoding]::new($false))

    $pdfOut = Join-Path $dir 'ARRIS-Company-Admin-Documentation.pdf'
    if (Test-Path -LiteralPath $pdfOut) { Remove-Item -Force -LiteralPath $pdfOut }

    $chrome = Join-Path ${env:ProgramFiles} 'Google\Chrome\Application\chrome.exe'
    if (-not (Test-Path -LiteralPath $chrome)) {
        $chrome = Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'
    }
    if (-not (Test-Path -LiteralPath $chrome)) { throw 'Google Chrome not found. Install Chrome or set CHROME_PATH.' }

    $uri = ([Uri]$htmlPath).AbsoluteUri
    # Chrome writes progress to stderr; avoid treating that as a PowerShell error.
    $chromeArgs = @(
        '--headless=new',
        '--disable-gpu',
        '--no-pdf-header-footer',
        '--virtual-time-budget=20000',
        "--print-to-pdf=$pdfOut",
        $uri
    )
    $p = Start-Process -FilePath $chrome -ArgumentList $chromeArgs -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -ne 0) { throw "Chrome exited with code $($p.ExitCode)" }
    Start-Sleep -Seconds 1
    if (-not (Test-Path -LiteralPath $pdfOut)) { throw 'PDF was not created.' }
    Get-Item -LiteralPath $pdfOut | Format-List FullName, Length, LastWriteTime
}
finally {
    Remove-Item -Force (Join-Path $dir '_pdf-combined.md') -ErrorAction SilentlyContinue
    Remove-Item -Force (Join-Path $dir '_fragment.html') -ErrorAction SilentlyContinue
    Remove-Item -Force (Join-Path $dir '_pdf-print.html') -ErrorAction SilentlyContinue
    Pop-Location
}
