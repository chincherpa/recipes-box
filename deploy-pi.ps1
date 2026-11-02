# Deployt recipes-box auf den Raspberry Pi und startet es in pm2.
# Aufruf (im Projektordner):
#   .\deploy-pi.ps1                 # normales Update
#   .\deploy-pi.ps1 -Port 3002      # anderer Port
#   .\deploy-pi.ps1 -RemoteBuild   # auf dem Pi bauen statt lokal (braucht viel RAM/Swap)
#   .\deploy-pi.ps1 -WithDb         # lokale DB erneut mitschicken (wird auf dem Pi NUR genutzt, wenn dort keine existiert)
param(
    [string]$Target = "pi@pi.local",
    [string]$AppDir = "~/recipes-box",
    [int]$Port = 3000,
    [switch]$WithDb,
    [switch]$RemoteBuild
)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$stateFile = Join-Path $PSScriptRoot ".deploy-pi.state"
$stateKey  = "$Target|$AppDir"
$deployed  = (Test-Path $stateFile) -and ((Get-Content $stateFile -ErrorAction SilentlyContinue) -contains $stateKey)
$sendDb    = $WithDb -or -not $deployed

$src   = Join-Path $env:TEMP "recipes-src.tgz"
$data  = Join-Path $env:TEMP "recipes-data.tgz"
$build = Join-Path $env:TEMP "recipes-build.tgz"
Remove-Item $src, $data, $build -ErrorAction SilentlyContinue

Write-Host "==> Packe Quellen" -ForegroundColor Cyan
tar -czf $src --exclude=node_modules --exclude=.next --exclude=.next-pi --exclude=.git --exclude=.claude `
    --exclude=*.tsbuildinfo --exclude=*.pdf --exclude=recipes.db* --exclude=deploy-pi.ps1 --exclude=.deploy-pi.state .
if ($LASTEXITCODE) { throw "tar (Quellen) fehlgeschlagen" }

$files = @($src, "scripts/pi-install.sh")

if (-not $RemoteBuild) {
    # Der Pi hat zu wenig RAM für `next build` -> lokal bauen, nur das Ergebnis übertragen.
    # Native Module (better-sqlite3, swc) installiert pnpm auf dem Pi.
    Write-Host "==> Baue lokal (pnpm build -> .next-pi)" -ForegroundColor Cyan
    $env:NEXT_DIST_DIR = ".next-pi"
    # pnpm-Shim kann kaputt sein -> testen, sonst corepack.
    $pnpmOk = $false
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm --version *> $null
        $pnpmOk = ($LASTEXITCODE -eq 0)
    }
    if (-not $pnpmOk) {
        if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) { throw "pnpm defekt/nicht gefunden und corepack fehlt" }
        function pnpm { corepack pnpm @args }
    }
    Push-Location website
    try { pnpm build } finally { Pop-Location; Remove-Item Env:NEXT_DIST_DIR -ErrorAction SilentlyContinue }
    if ($LASTEXITCODE) { throw "Lokaler Build fehlgeschlagen" }
    tar -czf $build -C website/.next-pi --exclude=./cache .
    if ($LASTEXITCODE) { throw "tar (Build) fehlgeschlagen" }
    $files += $build
}
if ($sendDb) {
    if (Test-Path recipes.db) {
        Write-Host "==> Packe Datenbank (Erstinstallation)" -ForegroundColor Cyan
        $running = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
        if ($running) { Write-Warning "Auf Port 3000 läuft lokal etwas (pnpm dev?). Für eine konsistente DB-Kopie vorher beenden." }
        $dbFiles = Get-ChildItem . -Filter "recipes.db*" | ForEach-Object { $_.Name }
        tar -czf $data @dbFiles
        if ($LASTEXITCODE) { throw "tar (Datenbank) fehlgeschlagen" }
        $files += $data
    } else {
        Write-Host "==> Keine lokale recipes.db -> Pi legt sie beim Start aus rezepte.csv/categories.json an" -ForegroundColor DarkGray
    }
} else {
    Write-Host "==> Datenbank wird nicht mitgeschickt (bereits deployt, -WithDb erzwingt es)" -ForegroundColor DarkGray
}

Write-Host "==> Kopiere nach $Target" -ForegroundColor Cyan
scp @files "${Target}:/tmp/"
if ($LASTEXITCODE) { throw "scp fehlgeschlagen" }

Write-Host "==> Installiere auf dem Pi" -ForegroundColor Cyan
$buildArg = if ($RemoteBuild) { "none" } else { "/tmp/recipes-build.tgz" }
$dataArg  = if ($files -contains $data) { "/tmp/recipes-data.tgz" } else { "none" }
ssh -t $Target "APP_DIR=$AppDir APP_PORT=$Port bash /tmp/pi-install.sh /tmp/recipes-src.tgz $dataArg $buildArg"
if ($LASTEXITCODE) { throw "Installation auf dem Pi fehlgeschlagen" }

if (-not $deployed) { Add-Content $stateFile $stateKey }
Remove-Item $src, $data, $build -ErrorAction SilentlyContinue
