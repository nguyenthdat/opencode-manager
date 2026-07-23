# pipe-objects-over-text

> Pass objects through pipeline, not formatted text

## Why It Matters

PowerShell's pipeline is an object pipeline. Passing structured objects preserves properties, types, and methods that downstream cmdlets use for filtering, sorting, and formatting. Passing text destroys all structure, forcing brittle string parsing. Text is the terminal format, not the transport format.

## Bad

```powershell
# Text pipeline — loses all structure
Get-Process | Out-String | ForEach-Object {
    # Now parsing strings — fragile!
    if ($_ -match '(\d+)\s+\d+\s+\d+\s+(\w+)') { ... }
}

Get-Service | Format-Table | Set-Content services.txt  # Saved formatted text
```

## Good

```powershell
# Object pipeline — preserves structure
Get-Process | Where-Object { $_.CPU -gt 100 } | Select-Object Name, CPU

Get-Service | Where-Object { $_.Status -eq 'Running' } |
    Export-Csv running-services.csv

# Format only at the very end, for display
Get-Service | Where-Object Status -eq 'Stopped' |
    Sort-Object Name |
    Format-Table Name, DisplayName -AutoSize
```

## The Pipeline as Data Flow

```powershell
# Filter -> Transform -> Sort -> Format (for display) / Export (for persistence)
Get-ChildItem -Recurse |
    Where-Object { $_.Length -gt 1MB } |     # Filter objects
    Select-Object Name, Length, LastWriteTime | # Select properties
    Sort-Object Length -Descending |          # Sort objects
    Export-Csv large-files.csv                # Export structured data
```

## See Also

- [pipe-no-format-left](pipe-no-format-left.md) - Don't format early
- [anti-format-right](anti-format-right.md) - Format-* anti-pattern
