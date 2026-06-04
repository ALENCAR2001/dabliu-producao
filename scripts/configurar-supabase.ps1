# DABLIU — assistente para colar chaves do Supabase (sem editar .env na mão)
# Uso: na pasta dabliu, rode:  npm run configurar

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DABLIU — Configurar login na nuvem" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Voce so precisa COPIAR e COLAR 3 coisas do site Supabase." -ForegroundColor Yellow
Write-Host "Abra no navegador:" -ForegroundColor White
Write-Host "  https://supabase.com/dashboard" -ForegroundColor Green
Write-Host ""
Write-Host "1) Clique no seu projeto (ex: dabliu)" -ForegroundColor Gray
Write-Host "2) Engrenagem (canto inferior esquerdo) = Project Settings" -ForegroundColor Gray
Write-Host "3) Menu API" -ForegroundColor Gray
Write-Host ""
Read-Host "Quando a pagina API estiver aberta, aperte ENTER aqui"

function Read-LineTrim($label) {
  $v = Read-Host $label
  return $v.Trim()
}

Write-Host ""
$url = Read-LineTrim "Cole a Project URL e aperte ENTER"
$anon = Read-LineTrim "Cole a chave anon public e aperte ENTER"
Write-Host ""
Write-Host "Agora a chave service_role (clique Reveal no site antes de copiar):" -ForegroundColor Yellow
$service = Read-Host "Cole a service_role e aperte ENTER" -AsSecureString
$servicePlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($service)
)

if (-not $url -or -not $anon -or -not $servicePlain) {
  Write-Host "Algum campo ficou vazio. Rode de novo: npm run configurar" -ForegroundColor Red
  exit 1
}

if ($url -notmatch '^https://') {
  $url = "https://$url"
}

Write-Host ""
$usarDb = Read-Host "Quer que o script crie as tabelas sozinho? (S/N)"
$dbLine = ""
if ($usarDb -match '^[sS]') {
  Write-Host ""
  Write-Host "No Supabase: Project Settings -> Database -> Connection string" -ForegroundColor Gray
  Write-Host "Escolha URI, copie a string e troque [YOUR-PASSWORD] pela senha do banco." -ForegroundColor Gray
  $dbLine = Read-LineTrim "Cole a URI completa (ou deixe vazio para pular)"
}

$envContent = @"
# Gerado por npm run configurar em $(Get-Date -Format 'yyyy-MM-dd HH:mm')
VITE_SUPABASE_URL=$url
VITE_SUPABASE_ANON_KEY=$anon
VITE_AUTH_EMAIL_DOMAIN=dabliu.app
SUPABASE_SERVICE_ROLE_KEY=$servicePlain
"@

if ($dbLine) {
  $envContent += "`nSUPABASE_DB_URL=$dbLine"
}

$envPath = Join-Path $root ".env"
Set-Content -Path $envPath -Value $envContent -Encoding UTF8
Write-Host ""
Write-Host "Arquivo .env salvo!" -ForegroundColor Green

Write-Host ""
Write-Host "Rodando configuracao (usuarios + teste)..." -ForegroundColor Cyan
npm run setup:cloud
$code = $LASTEXITCODE

if ($code -ne 0) {
  Write-Host ""
  Write-Host "Se pediu SQL: no Supabase abra SQL Editor, cole o arquivo" -ForegroundColor Yellow
  Write-Host "  supabase/setup_completo.sql" -ForegroundColor White
  Write-Host "e clique Run. Depois rode de novo: npm run configurar" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "ULTIMO PASSO NO SITE (obrigatorio):" -ForegroundColor Yellow
Write-Host "  Authentication -> Providers -> Email" -ForegroundColor White
Write-Host "  Desligue 'Confirm email' e salve." -ForegroundColor White
Write-Host ""
Write-Host "Depois: npm run dev" -ForegroundColor Green
Write-Host "  Funcionario: Michael, PIN 1001" -ForegroundColor Gray
Write-Host "  Admin: admin / admin123" -ForegroundColor Gray
Write-Host ""
