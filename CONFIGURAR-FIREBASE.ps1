$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
Write-Host 'Configuracion web publica de Firebase. No se requieren claves privadas.'
$firebaseProject = Read-Host 'projectId'
$firebaseWebKey = Read-Host 'apiKey'
if ($firebaseProject -notmatch '^[a-z][a-z0-9-]{4,29}$') { throw 'projectId no valido' }
if ($firebaseWebKey -notmatch '^[A-Za-z0-9_-]{20,100}$') { throw 'apiKey no valida' }
$settings = "FIREBASE_PROJECT_ID=$firebaseProject`nFIREBASE_API_KEY=$firebaseWebKey`n"
Set-Content -LiteralPath (Join-Path $PSScriptRoot '.dev.vars') -Value $settings -Encoding utf8
Write-Host 'Configuracion guardada en .dev.vars. Reinicia INICIAR.cmd.'
