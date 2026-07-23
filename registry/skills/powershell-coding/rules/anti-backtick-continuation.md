# anti-backtick-continuation

> Don't use backticks for line continuation

## Why It Matters

Backticks (\`) are invisible, fragile, and error-prone. A trailing space after a backtick silently breaks the continuation. They're invisible in most editors and code review tools. Use splatting, pipeline natural line breaks, or expression grouping instead — all of which are visible and robust.

## Bad

```powershell
# Invisible backticks — trailing space breaks everything
Get-ChildItem -Path C:\Temp -Recurse -Filter *.log `
    -Exclude *.gz -File -ErrorAction SilentlyContinue `
    | Where-Object { $_.Length -gt 1MB }   # Trailing space? Broken.

# Hard to read, impossible to maintain
Invoke-RestMethod -Uri $uri -Method Post -Body $json `
    -Headers $headers -ContentType 'application/json' `
    -TimeoutSec 30 -ErrorAction Stop
```

## Good

```powershell
# Splatting — clear, maintainable, no backticks
$gcParams = @{
    Path          = 'C:\Temp'
    Recurse       = $true
    Filter        = '*.log'
    Exclude       = '*.gz'
    File          = $true
    ErrorAction   = 'SilentlyContinue'
}
Get-ChildItem @gcParams | Where-Object { $_.Length -gt 1MB }

# Pipeline natural breaks — no continuation needed
$result = Get-ChildItem @gcParams |
    Where-Object { $_.Length -gt 1MB } |
    Sort-Object Length -Descending |
    Select-Object -First 10

# Expression grouping for calculations
$value = (Get-Date).AddDays(-30)  # No backtick needed
```

## Natural Line Breaks

```powershell
# Pipeline operators (|) allow natural breaks
Get-ChildItem |
    Where-Object Length -gt 1MB |
    Sort-Object Length |
    Select-Object -First 10

# Operators (+, -, -and, -or) allow natural breaks
if ((Test-Path $path) -and
    ((Get-Item $path).Length -lt 1GB) -and
    (-not $readOnly)) {
    Process-File $path
}

# Commas, semicolons in arrays/hashtables
$servers = @(
    'web-01',
    'web-02',
    'web-03'
)
```

## See Also

- [param-splatting](param-splatting.md) - Use splatting instead
- [param-named-params](param-named-params.md) - Named parameters
