param(
    [string]$ResourceGroup = 'ecowayer',
    [string]$Prefix = 'ecowayer'
)

$ErrorActionPreference = 'Stop'
$az = 'C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd'
if (-not (Test-Path -LiteralPath $az)) { throw 'Azure CLI não encontrada.' }

function Read-Dotenv([string]$path) {
    $values = @{}
    foreach ($line in Get-Content -LiteralPath $path) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $value = $matches[2].Trim()
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            $values[$matches[1]] = $value
        }
    }
    return $values
}

function New-Secret {
    $bytes = New-Object byte[] 32
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
    return [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
}

function Get-OrCreateSecret([string]$app, [string]$key) {
    $value = & $az webapp config appsettings list --resource-group $ResourceGroup --name $app --query "[?name=='$key'].value | [0]" --output tsv
    if ($LASTEXITCODE -ne 0) { throw "Falha ao consultar configuração de $app" }
    if ($value) { return $value.Trim() }
    return New-Secret
}

function Set-Settings([string]$app, [hashtable]$settings) {
    $file = Join-Path $env:TEMP ("ecowayer-" + [guid]::NewGuid().ToString() + '.json')
    try {
        [System.IO.File]::WriteAllText($file, ($settings | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))
        & $az webapp config appsettings set --resource-group $ResourceGroup --name $app --settings "@$file" --output none
        if ($LASTEXITCODE -ne 0) { throw "Falha ao configurar $app" }
        Write-Output "${app}: configurações aplicadas"
    } finally {
        Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue
    }
}

$root = Split-Path -Parent $PSScriptRoot
$admin = Read-Dotenv (Join-Path $root 'Admin/.env')
$user = Read-Dotenv (Join-Path $root 'Usuario/.env')
$ai = Read-Dotenv (Join-Path $root 'ia_agent/.env')
$sharedSecret = Get-OrCreateSecret "${Prefix}-admin-tcc" 'AI_SECRET_TOKEN'
$userUrl = "https://${Prefix}-site-tcc.azurewebsites.net"
$adminUrl = "https://${Prefix}-admin-site-tcc.azurewebsites.net"
$apiUrl = "https://${Prefix}-usuario-tcc.azurewebsites.net"
$aiUrl = "https://${Prefix}-ia-tcc.azurewebsites.net/api/v1/ai"
$base = @{
    DB_HOST = $user.DB_HOST
    DB_PORT = $user.DB_PORT
    DB_USER = $user.DB_USER
    DB_NAME = $user.DB_NAME
    NODE_ENV = 'production'
    FRONTEND_ORIGINS = "$userUrl,$adminUrl"
    AI_SECRET_TOKEN = $sharedSecret
    SCM_DO_BUILD_DURING_DEPLOYMENT = 'true'
}

$adminSettings = $base.Clone()
$adminSettings['DB_PASSWORD'] = $admin.DB_PASSWORD
$adminSettings['JWT_SECRET'] = Get-OrCreateSecret "${Prefix}-admin-tcc" 'JWT_SECRET'
$adminSettings['JWT_EXPIRES_IN'] = '1h'
$adminSettings['AI_AGENT_URL'] = $aiUrl
$adminSettings['GOOGLE_MAPS_API_KEY'] = $admin.GOOGLE_MAPS_API_KEY
Set-Settings "${Prefix}-admin-tcc" $adminSettings

$userSettings = $base.Clone()
$userSettings['DB_PASSWORD'] = $user.DB_PASSWORD
$userSettings['JWT_SECRET'] = Get-OrCreateSecret "${Prefix}-usuario-tcc" 'JWT_SECRET'
$userSettings['JWT_EXPIRES_IN'] = '1h'
$userSettings['AI_AGENT_URL'] = $aiUrl
foreach ($key in @('MP_ACCESS_TOKEN', 'MP_APP_ID', 'CLOUDINARY_CLOUD_NAME', 'VITE_CLOUDINARY_UPLOAD_PRESET', 'GOOGLE_MAPS_API_KEY', 'GOOGLE_CLIENT_ID')) {
    if ($user[$key]) { $userSettings[$key] = $user[$key] }
}
$userSettings['MP_TEST_MODE'] = '1'
$userSettings['MP_STAGING_ENABLED'] = '1'
$userSettings['MP_LIVE_ENABLED'] = '0'
$userSettings['MP_BACKEND_URL'] = $apiUrl
$userSettings['MP_FRONTEND_URL'] = $userUrl
Set-Settings "${Prefix}-usuario-tcc" $userSettings

$aiSettings = $base.Clone()
$aiSettings['SCM_DO_BUILD_DURING_DEPLOYMENT'] = 'false'
$aiSettings['DB_PASS'] = $ai.DB_PASS
$aiSettings['GEMINI_API_KEY'] = $ai.GEMINI_API_KEY
$aiSettings['GEMINI_MODEL'] = $ai.GEMINI_MODEL
$aiSettings['AI_TIMEOUT_MS'] = '8000'
$aiSettings['MAX_FILE_SIZE_BYTES'] = $ai.MAX_FILE_SIZE_BYTES
$aiSettings['DB_CONNECTION_LIMIT'] = '5'
Set-Settings "${Prefix}-ia-tcc" $aiSettings
