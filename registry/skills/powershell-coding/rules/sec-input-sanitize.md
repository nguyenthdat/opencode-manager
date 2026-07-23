# sec-input-sanitize

> Sanitize user input for paths, commands, values

## Why It Matters

User input passed to file operations, shell commands, or SQL queries can contain path traversal (`..\\`), command injection (`; rm -rf /`), or special characters that break expected behavior. Always validate and sanitize inputs before use, especially when they're used to construct paths, invoke native commands, or build queries.

## Bad

```powershell
# Path traversal attack
$fileName = Read-Host 'Enter filename'
Get-Content "C:\data\$fileName"  # User enters: ..\..\Windows\System32\config\SAM

# Command injection via native executable
$userInput = Read-Host 'Enter server'
& ping.exe $userInput  # User enters: localhost; Remove-Item -Recurse C:\
```

## Good

```powershell
# Validate and sanitize filenames
$fileName = Read-Host 'Enter filename'

# Remove path separators and restrict characters
$safeName = $fileName -replace '[<>:"/\\|?*]', ''
$safeName = [System.IO.Path]::GetFileName($safeName)  # Strip directory traversal

$targetPath = Join-Path 'C:\data' $safeName
# Verify the resolved path is still under C:\data
if (-not $targetPath.StartsWith((Resolve-Path 'C:\data').Path, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Invalid file path — path traversal detected'
}
Get-Content $targetPath

# Sanitize for native commands
$server = Read-Host 'Enter server'
if ($server -notmatch '^[a-zA-Z0-9.-]+$') {
    throw 'Invalid server name'
}
& ping.exe $server
```

## Input Sanitization Patterns

```powershell
# Validate IP address
function Test-ValidIpAddress {
    param([string]$Ip)
    [System.Net.IPAddress]::TryParse($Ip, [ref]$null)
}

# Validate email
function Test-ValidEmail {
    param([string]$Email)
    $Email -match '^[^@\s]+@[^@\s]+\.[^@\s]+$'
}

# Validate port number
function Test-ValidPort {
    param([int]$Port)
    $Port -ge 1 -and $Port -le 65535
}

# Sanitize for file system
function Get-SafeFileName {
    param([string]$Name)
    $invalid = [System.IO.Path]::GetInvalidFileNameChars()
    ($Name.ToCharArray() | Where-Object { $_ -notin $invalid }) -join ''
}
```

## See Also

- [sec-avoid-iex](sec-avoid-iex.md) - Avoid Invoke-Expression
- [err-validate-before-use](err-validate-before-use.md) - Validate inputs
