# anti-null-comparison-wrong

> Don't put \$null on the right side of comparison

## Why It Matters

PowerShell evaluates comparisons left-to-right. When `$null` is on the right side and the left side is an array, PowerShell compares `$null` against each element — potentially returning an array of booleans instead of a single boolean. `$null -eq $value` always evaluates `$null` first, producing a reliable single boolean.

## Bad

```powershell
# $null on right side — array comparison bug
$users = Get-ADUser -Filter *
if ($users -eq $null) {  # If $users is array, compares PER ELEMENT
    Write-Host "No users"
}

# Silent bug: $users = @(@{Name='Alice'}, @{Name='Bob'})
# $users -eq $null → @($false, $false) — truthy array! Condition passes when it shouldn't.

# Also bad with single values:
if ($value -eq $null) { ... }  # Just put $null left
```

## Good

```powershell
# $null on left side — always correct
$users = Get-ADUser -Filter *
if ($null -eq $users) {  # Always evaluates $null first
    Write-Host "No users"
}

# Or use explicit null checks
if (-not $users) { ... }
if ([string]::IsNullOrEmpty($value)) { ... }

# For arrays, check count
if ($users.Count -eq 0) { ... }
```

## Null Comparison Examples

```powershell
# ALWAYS correct:
$null -eq $value
$null -ne $value

# Array-safe null checks:
if (-not $value) { ... }                        # $null, empty array, empty string, 0 — all falsey
if ($null -eq $value) { ... }                   # Strict null check
if ([string]::IsNullOrWhiteSpace($value)) { ... }  # String-specific

# Count checks for arrays:
if ($array.Count -eq 0) { ... }
if ($array -and $array.Count -gt 0) { ... }
```

## See Also

- [param-validate-attribute](param-validate-attribute.md) - ValidateNotNullOrEmpty
- [err-validate-before-use](err-validate-before-use.md) - Input validation
