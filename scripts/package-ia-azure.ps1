$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$repo = Split-Path -Parent $PSScriptRoot
$project = Join-Path $repo 'ia_agent'
$destination = Join-Path $env:TEMP 'ecowayer-deploy'
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$archive = Join-Path $destination 'ia-prebuilt.zip'
Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue

Push-Location $repo
try {
    git archive --format=zip -o $archive HEAD:ia_agent
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível empacotar o agente.' }
} finally {
    Pop-Location
}

$zip = [System.IO.Compression.ZipFile]::Open($archive, [System.IO.Compression.ZipArchiveMode]::Update)
try {
    foreach ($folder in @('dist', 'node_modules')) {
        $base = (Resolve-Path (Join-Path $project $folder)).Path
        Get-ChildItem -LiteralPath $base -Recurse -File | ForEach-Object {
            $entry = $folder + '/' + $_.FullName.Substring($base.Length + 1).Replace([IO.Path]::DirectorySeparatorChar, '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $zip, $_.FullName, $entry, [System.IO.Compression.CompressionLevel]::Optimal
            ) | Out-Null
        }
    }
} finally {
    $zip.Dispose()
}
Write-Output $archive
