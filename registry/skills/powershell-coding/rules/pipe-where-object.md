# pipe-where-object

> Use Where-Object for filtering; never manual if

## Why It Matters

`Where-Object` is idiomatic, supports both script block and comparison statement syntax for readability, and integrates naturally into the pipeline. Using manual `if` inside `ForEach-Object` is more verbose and harder to read. `Where-Object` is optimized for streaming filter operations.

## Bad

```powershell
# Manual if — verbose, harder to parse
Get-Service | ForEach-Object {
    if ($_.Status -eq 'Running') {
        $_
    }
}

# Or collecting into a variable first
$running = @()
foreach ($svc in Get-Service) {
    if ($svc.Status -eq 'Running') { $running += $svc }
}
```

## Good

```powershell
# Script block syntax
Get-Service | Where-Object { $_.Status -eq 'Running' }

# Comparison statement syntax (more readable for simple conditions)
Get-Service | Where-Object Status -eq 'Running'

# Multiple conditions
Get-Service | Where-Object { $_.Status -eq 'Running' -and $_.StartType -eq 'Automatic' }

# Or with comparison statements
Get-Service | Where-Object Status -eq 'Running' | Where-Object StartType -eq 'Automatic'
```

## Where-Object Comparison Statements (PS 3.0+)

```powershell
# Simple comparison operators
Get-Process | Where-Object CPU -gt 100
Get-Process | Where-Object Name -like '*chrome*'
Get-Process | Where-Object Name -match '^s'
Get-Process | Where-Object Name -in @('pwsh', 'code')

# For complex logic, use script blocks
Get-Process | Where-Object { $_.CPU -gt 100 -and $_.WorkingSet -gt 500MB }
```

## See Also

- [pipe-filter-left](pipe-filter-left.md) - Filter early
- [pipe-foreach-object](pipe-foreach-object.md) - ForEach-Object
