# pipe-no-format-left

> Don't use Format-\* before data processing

## Why It Matters

`Format-Table`, `Format-List`, and `Format-Wide` produce *format objects* — not the original objects. These format objects have no properties beyond what's visible in the formatted output, making downstream filtering, sorting, or property access impossible. Formatting must be the last step, only for display.

## Bad

```powershell
# Format kills the objects
Get-Process |
    Format-Table Name, CPU, Memory |                     # Objects destroyed!
    Where-Object { $_.CPU -gt 100 }                       # $null — no CPU property

Get-Service |
    Format-List Name, Status |
    Export-Csv services.csv                               # Exports format metadata, not data
```

## Good

```powershell
# Process first, format last (for display only)
Get-Process |
    Where-Object { $_.CPU -gt 100 } |
    Sort-Object CPU -Descending |
    Format-Table Name, CPU, Memory -AutoSize              # Only for display

# Skip Format-* entirely for data export
Get-Process |
    Where-Object { $_.CPU -gt 100 } |
    Select-Object Name, CPU, WorkingSet |
    Export-Csv high-cpu.csv
```

## Format Rules

```powershell
# Rule: Format-* is the LAST cmdlet in any pipeline

# Display to user:
... | Format-Table -AutoSize
... | Format-List
... | Format-Wide -AutoSize

# Export data (NO Format-*):
... | Export-Csv data.csv
... | Export-Json data.json
... | Set-Content data.txt
... | Out-File data.txt

# NEVER: Format-* | Export-*  (exports format junk)
# NEVER: Format-* | Where-Object (no properties)
# NEVER: Format-* | Set-Content (saves view, not data)
```

## See Also

- [pipe-objects-over-text](pipe-objects-over-text.md) - Objects not text
- [anti-format-right](anti-format-right.md) - Format-* anti-pattern
