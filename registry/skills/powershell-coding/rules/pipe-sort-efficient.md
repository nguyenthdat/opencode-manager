# pipe-sort-efficient

> Sort once, as late as possible

## Why It Matters

Sorting is O(n log n) — expensive for large datasets. Sorting early, then filtering (which removes items), means you sorted items you later discard. Sort after filtering to minimize the set being sorted. Also, sorting twice in a pipeline is wasteful; sort once, near the end.

## Bad

```powershell
# Sorts everything, then filters out most of it
Get-ChildItem -Recurse |
    Sort-Object Length -Descending |       # Sorted 500K files
    Where-Object { $_.Length -gt 1MB }    # Kept only 50 — 499K sorts wasted
```

## Good

```powershell
# Filter first, then sort the smaller set
Get-ChildItem -Recurse |
    Where-Object { $_.Length -gt 1MB } |   # Filtered to 50 files
    Sort-Object Length -Descending         # Only 50 to sort
```

## When Sort Must Be Early

```powershell
# Sort early only when ordering affects selection, e.g. "top N"
Get-ChildItem -Recurse |
    Sort-Object Length -Descending |       # Must sort first
    Select-Object -First 10               # Then take top 10

# But even then, consider provider-level sorting if available
Get-ADUser -Filter * -Properties LastLogonDate |
    Sort-Object LastLogonDate -Descending -Top 10  # Native -Top parameter
```

## See Also

- [pipe-filter-left](pipe-filter-left.md) - Filter early
- [perf-pipeline-over-loops](perf-pipeline-over-loops.md) - Pipeline performance
