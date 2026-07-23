# pipe-group-object

> Use Group-Object for grouping data

## Why It Matters

`Group-Object` provides a declarative, pipeline-friendly way to group objects by property values, avoiding manual hashtable accumulation. It returns structured `GroupInfo` objects with `Name`, `Count`, and `Group` properties, making it easy to aggregate, report, or iterate over groups.

## Bad

```powershell
# Manual grouping — verbose and error-prone
$groups = @{}
Get-Process | ForEach-Object {
    $company = $_.Company ?? 'Unknown'
    if (-not $groups.ContainsKey($company)) {
        $groups[$company] = @()
    }
    $groups[$company] += $_
}
$groups.GetEnumerator() | ForEach-Object {
    [PSCustomObject]@{ Company = $_.Key; Count = $_.Value.Count }
}
```

## Good

```powershell
# Group-Object — declarative and concise
Get-Process |
    Where-Object { $_.Company } |
    Group-Object -Property Company |
    Select-Object Name, Count,
        @{N='TotalMemoryMB'; E={[math]::Round(($_.Group | Measure-Object WorkingSet -Sum).Sum / 1MB, 2)}}

# Or simpler
Get-Service | Group-Object Status
# Outputs: GroupInfo objects with Name=Running/Stopped, Count, Group
```

## Advanced Grouping

```powershell
# Group by calculated property
Get-ChildItem -File |
    Group-Object { $_.Extension -replace '^\.', 'filetype_' } |
    Sort-Object Count -Descending |
    Select-Object -First 10

# Group with case-insensitive option
Get-Process | Group-Object -Property Company -CaseSensitive:$false

# Group by multiple properties (PS 7.0+)
Get-Process | Group-Object -Property Company, Product
```

## See Also

- [pipe-where-object](pipe-where-object.md) - Where-Object filtering
- [pipe-sort-efficient](pipe-sort-efficient.md) - Sort efficiently
