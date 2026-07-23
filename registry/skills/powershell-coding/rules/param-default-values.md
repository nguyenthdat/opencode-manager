# param-default-values

> Set sensible defaults for optional params

## Why It Matters

Well-chosen defaults reduce friction for common use cases and document expected values. Users shouldn't need to specify every parameter when a reasonable default exists. Defaults also make your function self-documenting — the parameter declaration shows what "normal" looks like.

## Bad

```powershell
function Invoke-HealthCheck {
    param(
        [int]$Timeout,           # No default — user must always specify
        [string]$Protocol,       # No default — guessed in body
        [int]$RetryCount
    )

    # Hidden defaults in body — hard to discover
    if (-not $Timeout) { $Timeout = 30 }
    if (-not $Protocol) { $Protocol = 'https' }
    if (-not $RetryCount) { $RetryCount = 3 }
}
```

## Good

```powershell
function Invoke-HealthCheck {
    [CmdletBinding()]
    param(
        [int]$TimeoutSeconds = 30,
        [ValidateSet('http', 'https')]
        [string]$Protocol = 'https',
        [ValidateRange(0, 10)]
        [int]$RetryCount = 3
    )
}

# Simple use case — no params needed
Invoke-HealthCheck

# Explicit overrides
Invoke-HealthCheck -TimeoutSeconds 5 -RetryCount 0
```

## Default Values Best Practices

```powershell
# Use expressions for runtime defaults
param(
    [string]$OutputPath = (Join-Path $PWD 'output'),
    [datetime]$StartDate = (Get-Date).AddDays(-30),
    [string]$ComputerName = $env:COMPUTERNAME
)

# Use $null intentionally for "not specified" semantics
param(
    [string]$ApiKey = $null  # Clarify that it's optional
)

# Never use mutable objects as defaults
param(
    # BAD: same ArrayList reused across calls
    # [System.Collections.ArrayList]$Items = [System.Collections.ArrayList]::new()

    # GOOD: create in begin block
    [System.Collections.ArrayList]$Items
)
begin {
    if (-not $Items) {
        $Items = [System.Collections.ArrayList]::new()
    }
}
```

## See Also

- [param-mandatory-explicit](param-mandatory-explicit.md) - Mark required params
- [param-parameter-sets](param-parameter-sets.md) - Parameter sets
