# name-constants-UPPER_SNAKE

> Use UPPER_SNAKE_CASE for constants

## Why It Matters

UPPER_SNAKE_CASE visually distinguishes constants (values set once, never change) from variables (values that change during execution). This convention spans most programming languages and makes code instantly more readable — readers know a UPPER_SNAKE value won't be reassigned.

## Bad

```powershell
$maxretries = 3               # Looks like a variable
$defaultTimeoutSeconds = 30   # Looks mutable
$apiBaseUrl = 'https://api'   # Could be changed accidentally

# Inconsistent: is this a constant?
$maxConnections = 100
# 200 lines later...
$maxConnections = 50          # Oops — was it a constant or not?
```

## Good

```powershell
Set-Variable -Name MAX_RETRIES -Value 3 -Option Constant
Set-Variable -Name DEFAULT_TIMEOUT_SECONDS -Value 30 -Option Constant
Set-Variable -Name API_BASE_URL -Value 'https://api.corp.com' -Option Constant

# Or use ReadOnly (can be removed with Remove-Variable)
Set-Variable -Name CONFIG_PATH -Value "$PSScriptRoot/config.json" -Option ReadOnly

# Usage throughout script
for ($i = 0; $i -lt $MAX_RETRIES; $i++) {
    Invoke-RestMethod $API_BASE_URL -TimeoutSec $DEFAULT_TIMEOUT_SECONDS
}
```

## Module Constants

```powershell
# In module scope (.psm1)
Set-Variable -Name MODULE_VERSION -Value '1.2.3' -Option ReadOnly -Scope Script
Set-Variable -Name DEFAULT_PAGE_SIZE -Value 50 -Option Constant -Scope Script

function Get-LargeResult {
    [CmdletBinding()]
    param(
        [int]$PageSize = $script:DEFAULT_PAGE_SIZE
    )
    # $script:DEFAULT_PAGE_SIZE — clearly a module constant
}
```

## See Also

- [name-variables-camelCase](name-variables-camelCase.md) - camelCase variables
- [mod-module-scope-variables](mod-module-scope-variables.md) - Module scope
