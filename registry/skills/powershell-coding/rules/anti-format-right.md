# anti-format-right

> Don't use Format-Table/List before passing data

## Why It Matters

`Format-*` cmdlets convert rich objects into formatting objects — essentially dead strings. Once formatted, you can't filter, sort, select properties, or export as structured data. "Format right" means `Format-*` only belongs at the very end of a pipeline, and only for display to a human.

## Bad

```powershell
# Format kills objects — downstream failures
Get-Process |
    Format-Table Name, CPU, Memory |     # Objects destroyed
    Where-Object { $_.CPU -gt 100 }      # $null — no CPU property on format object

Get-Service |
    Format-List Name, Status |
    Export-Csv services.csv              # Exports format metadata, not service data

$data = Get-ChildItem | Format-Table     # $data is format objects — useless
```

## Good

```powershell
# Process, then format at the end (display only)
Get-Process |
    Where-Object { $_.CPU -gt 100 } |
    Sort-Object CPU -Descending |
    Format-Table Name, CPU, Memory -AutoSize  # LAST cmdlet

# For data export, skip Format-* entirely
Get-Process |
    Where-Object { $_.CPU -gt 100 } |
    Select-Object Name, CPU, WorkingSet |
    Export-Csv high-cpu.csv
```

## The "Filter Left, Format Right" Rule

```powershell
# WRONG: Format -> Process -> Export
Get-X | Format-Y | Where-Z | Export-Csv  # Broken

# RIGHT: Filter -> Process -> Export
Get-X | Where-Z | Sort-Y | Export-Csv    # Works

# DISPLAY ONLY: Filter -> Process -> Format
Get-X | Where-Z | Sort-Y | Format-Y      # Looks good
```

## See Also

- [pipe-no-format-left](pipe-no-format-left.md) - Don't format early
- [pipe-objects-over-text](pipe-objects-over-text.md) - Objects over text
