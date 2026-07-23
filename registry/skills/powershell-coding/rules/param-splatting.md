# param-splatting

> Use splatting (@params) for complex parameter sets

## Why It Matters

Splatting replaces long, hard-to-read command lines with a clean hashtable or array. It's especially valuable for conditional parameter construction — add or omit parameters based on conditions — without stringifying commands or using `Invoke-Expression`. Splatting keeps code readable and maintainable.

## Bad

```powershell
# Inline — hard to read and maintain
Invoke-RestMethod -Uri 'https://api.example.com/data' `
    -Method Post -Body $jsonBody `
    -Headers @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' } `
    -ContentType 'application/json' -TimeoutSec 30 `
    -SkipCertificateCheck:$env:DEV_MODE -ErrorAction Stop
```

## Good

```powershell
# Splatting — clean and conditional
$apiParams = @{
    Uri         = 'https://api.example.com/data'
    Method      = 'Post'
    Body        = $jsonBody
    Headers     = @{ Authorization = "Bearer $token" }
    ContentType = 'application/json'
    TimeoutSec  = 30
    ErrorAction = 'Stop'
}

if ($env:DEV_MODE) {
    $apiParams.SkipCertificateCheck = $true
}

if ($ProxyServer) {
    $apiParams.Proxy = $ProxyServer
}

Invoke-RestMethod @apiParams
```

## Hashtable vs Array Splatting

```powershell
# Hashtable splatting — for named parameters
$params = @{
    Path        = 'C:\Data'
    Recurse     = $true
    Filter      = '*.log'
    ErrorAction = 'SilentlyContinue'
}
Get-ChildItem @params

# Array splatting — for positional parameters
$args = @('C:\Data', '*.log')
Get-ChildItem @args   # Position 0 = Path, Position 1 = Filter

# Combining both
$commonParams = @{ ErrorAction = 'Stop'; Verbose = $true }
Get-ChildItem @commonParams -Path 'C:\Data'
```

## See Also

- [param-named-params](param-named-params.md) - Named parameters
- [anti-backtick-continuation](anti-backtick-continuation.md) - Backtick anti-pattern
