# err-erroraction-preference

> Don't globally set \$ErrorActionPreference to SilentlyContinue

## Why It Matters

Setting `$ErrorActionPreference = 'SilentlyContinue'` at script scope suppresses ALL errors, hiding real bugs, making debugging impossible, and masking data corruption. It's the PowerShell equivalent of `try { } catch {}` around everything. Handle expected errors explicitly; never silently suppress everything.

## Bad

```powershell
# Global silent mode — hides everything
$ErrorActionPreference = 'SilentlyContinue'

Get-Content missing.txt  # Silently returns $null
Remove-Item C:\Windows\System32\*  # Silently fails
Invoke-WebRequest https://invalid  # Silently returns nothing
$result = 1/0  # Silently $null — no indication of error
```

## Good

```powershell
# Per-command handling
Get-Content missing.txt -ErrorAction SilentlyContinue   # Only this one
Remove-Item *.tmp -ErrorAction SilentlyContinue          # Only this one

# Or handle expected failures explicitly
if (Test-Path 'data.json') {
    $data = Get-Content 'data.json'
} else {
    Write-Verbose "No data.json found, using defaults"
    $data = '{}'
}

# Use strict mode for development
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'  # Fail fast during dev
```

## When \$ErrorActionPreference = 'Stop' Makes Sense

```powershell
# Only at the top-level in CI scripts that must fail on any error
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# Every unhandled error now terminates
. ./build.ps1
. ./test.ps1
. ./deploy.ps1
```

## See Also

- [cmd-terminating-vs-non](cmd-terminating-vs-non.md) - Intentional error escalation
- [anti-overly-verbose-script](anti-overly-verbose-script.md) - Don't globally mute errors
