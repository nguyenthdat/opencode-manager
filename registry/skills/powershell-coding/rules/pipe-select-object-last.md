# pipe-select-object-last

> Select properties as late as possible

## Why It Matters

`Select-Object` strips all non-selected properties from objects. If you select properties early and downstream cmdlets need a property you removed, you get silent `$null` or failures. Selecting late also keeps objects rich for debugging — you can inspect all properties until the final output.

## Bad

```powershell
Get-ChildItem -Recurse |
    Select-Object Name, Length |     # Lost FullName, LastWriteTime, etc.
    Where-Object { $_.Length -gt 1MB } |
    Sort-Object Name
# Can't use FullName for logging, can't sort by LastWriteTime
```

## Good

```powershell
Get-ChildItem -Recurse |
    Where-Object { $_.Length -gt 1MB } |
    Sort-Object Length -Descending |
    Select-Object Name, FullName, Length, LastWriteTime  # Select last

# Or if you must reshape early, use calculated properties
Get-ChildItem -Recurse |
    Where-Object { $_.Length -gt 1MB } |
    Select-Object Name, FullName, @{N='SizeMB'; E={[math]::Round($_.Length/1MB, 2)}}, LastWriteTime |
    Export-Csv report.csv
```

## Exception: Select Early for Performance

```powershell
# When retrieving from remote systems, select needed properties early
# to reduce network transfer — but only when you know exactly what you need
Get-ADUser -Filter * -Properties * |  # ALL properties — huge transfer
    Select-Object Name, SamAccountName, Email

# Better — ask for only what you need at the source
Get-ADUser -Filter * -Properties Email |
    Select-Object Name, SamAccountName, Email  # Source-side filtering
```

## See Also

- [pipe-filter-left](pipe-filter-left.md) - Filter early, format right
- [anti-select-object-star](anti-select-object-star.md) - Don't Select-Object *
