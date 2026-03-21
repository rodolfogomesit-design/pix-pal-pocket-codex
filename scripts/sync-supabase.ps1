param(
  [string]$ProjectRef = "ylmrmidgxhcthwmoebzl",
  [string]$DbUrl = $env:SUPABASE_DB_URL
)

$ErrorActionPreference = "Stop"

Write-Host "Linkando projeto Supabase: $ProjectRef" -ForegroundColor Cyan
& npx.cmd supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) {
  Write-Host "Falha ao linkar o projeto." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host "Aplicando migrations remotas..." -ForegroundColor Cyan
if ($DbUrl) {
  Write-Host "Usando SUPABASE_DB_URL para conectar ao banco." -ForegroundColor Cyan
  & npx.cmd supabase db push --db-url $DbUrl
} else {
  & npx.cmd supabase db push
}
if ($LASTEXITCODE -ne 0) {
  Write-Host "Falha ao aplicar migrations." -ForegroundColor Red
  if (-not $DbUrl) {
    Write-Host "Se a falha for de rede/timeout, configure SUPABASE_DB_URL com a string do pooler e rode novamente." -ForegroundColor Yellow
  }
  exit $LASTEXITCODE
}

Write-Host "Supabase sincronizado com sucesso." -ForegroundColor Green
