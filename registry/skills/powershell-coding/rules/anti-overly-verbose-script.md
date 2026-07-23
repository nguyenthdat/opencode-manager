# anti-overly-verbose-script

> Don't suppress errors globally with -ErrorAction 0

## Why It Matters

Globally suppressing errors hides real problems — failed commands, missing files, permission errors — all silently swallowed. The script appears to work but produces incomplete or incorrect results. Suppress errors only on specific commands where you handle the absence of a result.

## Bad

```powershell
# Global error suppression — hides everything
$ErrorActionPreference = 'SilentlyContinue'

Get-Content missing.json       # Fails silently — $data is $null
Remove-Item critical.txt       # Still exists — no error
Connect-Database -Server $db   # Connection failed — continues anyway
Publish-Result                 # Publishes null data from failed steps

# Or: -ErrorAction SilentlyContinue on everything
Get-Content a.txt -ErrorAction SilentlyContinue  # Maybe OK
Get-Content b.txt -ErrorAction SilentlyContinue  # Maybe OK
Get-Content c.txt -ErrorAction SilentlyContinue  # Maybe OK
# Any of these could be silently null — downstream breaks
```

## Good

```powershell
# Handle each expected error explicitly
$dataPath = 'data.json'
if (Test-Path $dataPath) {
    $data = Get-Content $dataPath -ErrorAction Stop
} else {
    Write-Verbose "No data file, using defaults"
    $data = Get-DefaultData
}

# Per-command error action with clear intent
Get-ChildItem C:\Users\*\Documents -ErrorAction SilentlyContinue |
    ForEach-Object { ... }
# Intent: skip inaccessible user folders — clear and narrow

# Use try/catch for known risky operations
try {
    Remove-Item *.tmp -ErrorAction Stop
} catch [System.Management.Automation.ItemNotFoundException] {
    Write-Verbose "No .tmp files to clean up"
}
```

## See Also

- [err-erroraction-preference](err-erroraction-preference.md) - Don't globally mute
- [cmd-terminating-vs-non](cmd-terminating-vs-non.md) - Error action intent
