# perf-hash-table-lookup

> Use hashtable for O(1) lookups over Where-Object

## Why It Matters

`Where-Object` scans every item linearly — O(n) per lookup, O(n*m) for m lookups on n items. A hashtable lookup is O(1), turning O(n*m) into O(n+m). For joining data, deduplication, or repeated lookups in loops, hashtables are orders of magnitude faster.

## Bad

```powershell
# O(n*m) — Where-Object scans all departments for each user
$departments = Get-ADGroup -Filter "GroupCategory -eq 'Security'"
$users = Get-ADUser -Filter *

foreach ($user in $users) {
    $dept = $departments | Where-Object { $_.DistinguishedName -eq $user.Department }
    if ($dept) {
        [PSCustomObject]@{ User = $user.Name; Department = $dept.Name }
    }
}
# 1000 users * 500 departments = 500K comparisons
```

## Good

```powershell
# O(n+m) — build hashtable once, O(1) lookups
$departments = Get-ADGroup -Filter "GroupCategory -eq 'Security'"

$deptHash = @{}
foreach ($dept in $departments) {
    $deptHash[$dept.DistinguishedName] = $dept.Name
}

$users = Get-ADUser -Filter *
foreach ($user in $users) {
    if ($deptHash.ContainsKey($user.Department)) {
        [PSCustomObject]@{
            User       = $user.Name
            Department = $deptHash[$user.Department]
        }
    }
}
# 1000 users + 500 departments = 1500 operations
```

## Hashtable Patterns

```powershell
# Deduplication
$seen = @{}
Get-Content huge.log | ForEach-Object {
    if (-not $seen.ContainsKey($_)) {
        $seen[$_] = $true
        $_  # Output only new lines
    }
}

# Join / lookup
$configHash = @{}
Import-Csv config.csv | ForEach-Object { $configHash[$_.Key] = $_ }

foreach ($item in $data) {
    $config = $configHash[$item.Key]
    if ($config) {
        $item.Value * $config.Multiplier
    }
}
```

## See Also

- [perf-pipeline-over-loops](perf-pipeline-over-loops.md) - Pipeline performance
- [pipe-where-object](pipe-where-object.md) - Where-Object usage
