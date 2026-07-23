# pipe-filter-left

> Filter as early as possible (left side of pipeline)

## Why It Matters

Every cmdlet in the pipeline processes objects passed to it. Filtering early means downstream cmdlets process fewer objects — reducing CPU, memory, and I/O. This is the "filter left, format right" principle: put `Where-Object` and other filters as early as possible, `Format-*` only at the end.

## Bad

```powershell
# Processes ALL objects, then filters
Get-ChildItem ~/Documents -Recurse |
    Select-Object Name, Length, LastWriteTime |
    Sort-Object Length -Descending |
    Where-Object { $_.Length -gt 1MB }  # Filter last — sorted 1M files first
```

## Good

```powershell
# Filter first, then process only what's needed
Get-ChildItem ~/Documents -Recurse |
    Where-Object { $_.Length -gt 1MB } |   # Filter early — fewer objects below
    Select-Object Name, Length, LastWriteTime |
    Sort-Object Length -Descending
```

## Filter at Source When Possible

```powershell
# Even better — filter at the provider level
Get-ChildItem ~/Documents -Recurse -File |
    Where-Object { $_.Length -gt 1MB }  # -File filter at provider

# Or use cmdlet-native filtering
Get-ADUser -Filter "Enabled -eq '$true' -and Department -eq 'Sales'" |
    Select-Object Name, Email  # Filtered at AD level, not locally
```

## See Also

- [pipe-select-object-last](pipe-select-object-last.md) - Select properties late
- [pipe-where-object](pipe-where-object.md) - Where-Object usage
