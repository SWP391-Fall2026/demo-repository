param(
    [string]$Profile = "auth-supabase",
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$MavenArgs
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Get-JavaMajorVersion([string]$JavaExecutable) {
    if (-not (Test-Path -LiteralPath $JavaExecutable)) {
        return 0
    }

    # java writes version metadata to stderr. Keep PowerShell's Stop mode from
    # turning that expected output into NativeCommandError.
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $versionText = (& $JavaExecutable -version 2>&1 | Out-String)
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    $match = [regex]::Match($versionText, 'version "(?<major>\d+)')
    if (-not $match.Success) {
        return 0
    }

    return [int]$match.Groups['major'].Value
}

$javaExecutables = [System.Collections.Generic.List[string]]::new()
if ($env:JAVA_HOME) {
    $javaExecutables.Add((Join-Path $env:JAVA_HOME 'bin\java.exe'))
}

$javaRoots = @(
    'C:\Program Files\Java',
    'C:\Program Files\Eclipse Adoptium',
    'C:\Program Files\Microsoft\jdk'
)
foreach ($javaRoot in $javaRoots) {
    if (Test-Path -LiteralPath $javaRoot) {
        Get-ChildItem -LiteralPath $javaRoot -Directory -ErrorAction SilentlyContinue |
            ForEach-Object { $javaExecutables.Add((Join-Path $_.FullName 'bin\java.exe')) }
    }
}

$javaExecutables = @($javaExecutables | Select-Object -Unique)
$validJavas = foreach ($javaExecutable in $javaExecutables) {
    $major = Get-JavaMajorVersion $javaExecutable
    if ($major -ge 17) {
        [pscustomobject]@{ Path = $javaExecutable; Major = $major }
    }
}

$selectedJava = $validJavas |
    Sort-Object @{ Expression = { if ($_.Major -eq 21) { 0 } else { 1 } }; Descending = $false }, `
        @{ Expression = 'Major'; Descending = $true }, @{ Expression = 'Path'; Descending = $false } |
    Select-Object -First 1

if (-not $selectedJava) {
    Write-Error "JDK 17 or newer not found. Install JDK 21, then rerun. Expected JAVA_HOME or a JDK under C:\Program Files\Java."
    exit 1
}

$env:JAVA_HOME = Split-Path -Parent (Split-Path -Parent $selectedJava.Path)
$env:Path = "$($env:JAVA_HOME)\bin;$env:Path"
Write-Host "Using JDK $($selectedJava.Major): $($env:JAVA_HOME)"

$mvnArgs = @('-f', 'backend/pom.xml', 'spring-boot:run')
if ($Profile) {
    $mvnArgs += "-Dspring-boot.run.profiles=$Profile"
}

# Local profile is self-contained for UI development. Use an in-memory H2
# database and a valid signing key when caller did not provide overrides.
if ($Profile -eq 'local' -and -not $MavenArgs) {
    $mvnArgs += '-Dspring-boot.run.arguments=--spring.datasource.url=jdbc:h2:mem:storage_local;MODE=PostgreSQL;DB_CLOSE_DELAY=-1 --spring.datasource.driver-class-name=org.h2.Driver --spring.datasource.username=sa --spring.datasource.password= --spring.jpa.hibernate.ddl-auto=create-drop --jwt.secret=local-dev-jwt-signing-key-2026-strong-secret-0123456789 --app.scheduling.enabled=false'
}
if ($MavenArgs) {
    $mvnArgs += $MavenArgs
}

& mvn @mvnArgs
exit $LASTEXITCODE
