# push-both.ps1
# Push current branch to BOTH GitHub repos simultaneously
# Usage: .\push-both.ps1 [-Branch main] [-Force]

param(
    [string]$Branch = "main",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Dukan Dost - Dual GitHub Push" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Stage all changes and prompt for commit message if there are uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "[!] Uncommitted changes detected:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $msg = Read-Host "Enter commit message (or press Enter to skip commit)"
    if ($msg) {
        git add -A
        git commit -m $msg
        Write-Host "[+] Committed: $msg" -ForegroundColor Green
    }
}

# Push to adityanathpatel/DukanDost
Write-Host "[1/2] Pushing to  adityanathpatel/DukanDost  ..." -ForegroundColor Cyan
if ($Force) { git push origin $Branch --force } else { git push origin $Branch }
Write-Host "      --> Done!" -ForegroundColor Green

# Push to saumy-chaurasia/Meri-Dukan
Write-Host "[2/2] Pushing to  saumy-chaurasia/Meri-Dukan  ..." -ForegroundColor Cyan
if ($Force) { git push meri-dukan $Branch --force } else { git push meri-dukan $Branch }
Write-Host "      --> Done!" -ForegroundColor Green

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Both repos updated!" -ForegroundColor Green
Write-Host "  - https://github.com/adityanathpatel/DukanDost" -ForegroundColor White
Write-Host "  - https://github.com/saumy-chaurasia/Meri-Dukan" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan
