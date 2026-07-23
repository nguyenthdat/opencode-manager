# cmd-terminating-vs-non

> Use \$ErrorActionPreference intentionally

## Why It Matters

PowerShell distinguishes terminating errors (stop execution, trigger `catch`) from non-terminating errors (write to error stream, continue). Mismanaging `$ErrorActionPreference` leads to silent failures or catastrophic stops at the wrong level. Choose the right error escalation for each scenario.

## Bad

```powershell
# Global silent mode — hides ALL errors
$ErrorActionPreference = 'SilentlyContinue'
Get-Process nonexistent -ErrorAction SilentlyContinue  # Just this one

# Or global stop — any write-error crashes script
$ErrorActionPreference = 'Stop'
Get-ChildItem C:\Users\*\Documents  # Crashes on first inaccessible folder

# Mixing both: global stop, then surprised by crash
$ErrorActionPreference = 'Stop'
Remove-Item *.tmp  # Crashes if no .tmp files exist
```

## Good

```powershell
# Use per-command -ErrorAction, not global preference
Get-Process nonexistent -ErrorAction SilentlyContinue  # Only this one
Get-ChildItem C:\Users\*\Documents -ErrorAction SilentlyContinue  # Skip inaccessible

# Use try/catch for known risky operations
try {
    Remove-Item *.tmp -ErrorAction Stop  # Upgrade to terminating
} catch {
    Write-Warning "No .tmp files to remove: $_"
}

# Or check before acting
if (Test-Path 'important.txt') {
    Remove-Item 'important.txt'
} else {
    Write-Verbose "Nothing to remove"
}
```

## ErrorAction Values

```powershell
-ErrorAction Continue             # Default — show error, continue
-ErrorAction SilentlyContinue     # Suppress error, continue
-ErrorAction Stop                 # Upgrade to terminating (catchable)
-ErrorAction Inquire              # Prompt user
-ErrorAction Ignore               # Suppress entirely, don't add to $Error
```

## See Also

- [err-erroraction-preference](err-erroraction-preference.md) - Don't globally mute errors
- [err-terminating-errors](err-terminating-errors.md) - Terminating errors
- [err-try-catch-specific](err-try-catch-specific.md) - Specific catch
