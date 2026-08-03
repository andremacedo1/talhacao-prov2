$ErrorActionPreference = "Stop"
$pastaLog = "log"

if (-not (Test-Path $pastaLog)) {
    New-Item -ItemType Directory -Path $pastaLog | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$arquivoLog = "$pastaLog\$timestamp-sync.log"

Write-Host "Sincronizando Talhação PRO v2..." -ForegroundColor Cyan

try {
    git config user.name "André Macedo da Rosa"
    git config user.email "andremacedo1@gmail.com"
    git remote set-url origin https://andremacedo1@github.com/andremacedo1/talhacao-prov2.git
    
    "node_modules
.next
.env.local
.DS_Store" | Out-File -Encoding utf8 .gitignore
    
    git add .
    git commit -m "feat: atualizacao automatica via script" 2>&1
    git push -u origin main 2>&1

    "SUCESSO" | Out-File -FilePath $arquivoLog -Encoding utf8
    Write-Host "Sincronizado com sucesso!" -ForegroundColor Green
} catch {
    "$_.Exception.Message" | Out-File -FilePath $arquivoLog -Encoding utf8
    Write-Host "Erro na sincronização." -ForegroundColor Red
}
