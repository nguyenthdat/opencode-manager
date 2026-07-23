# perf-avoid-add-member

> Avoid Add-Member in loops; use [PSCustomObject]

## Why It Matters

`Add-Member` is a reflection-based operation that's significantly slower than direct property assignment. In loops, the overhead compounds. `[PSCustomObject]@{ Property = $value }` creates objects with direct property assignment — it's idiomatic and faster.

## Bad

```powershell
# Add-Member in loop — slow reflection per object
Get-Process | ForEach-Object {
    $obj = [PSCustomObject]@{ Name = $_.Name }
    $obj | Add-Member -NotePropertyName CPU -NotePropertyValue $_.CPU -Force
    $obj | Add-Member -NotePropertyName MemoryMB -NotePropertyValue ([math]::Round($_.WorkingSet64 / 1MB, 2)) -Force
    $obj
}
```

## Good

```powershell
# Direct property assignment — fast
Get-Process | ForEach-Object {
    [PSCustomObject]@{
        Name      = $_.Name
        CPU       = $_.CPU
        MemoryMB  = [math]::Round($_.WorkingSet64 / 1MB, 2)
    }
}

# Or use Select-Object with calculated properties
Get-Process | Select-Object Name, CPU,
    @{Name = 'MemoryMB'; Expression = { [math]::Round($_.WorkingSet64 / 1MB, 2) }}
```

## When Add-Member Is Acceptable

```powershell
# OK: adding a type name to an object (not in a loop)
$obj = [PSCustomObject]@{ Name = 'server01' }
$obj.PSTypeNames.Insert(0, 'MyModule.Server')

# OK: adding a ScriptMethod once to a prototype
$prototype = [PSCustomObject]@{ }
$prototype | Add-Member -MemberType ScriptMethod -Name ToUpper -Value { $this.Name.ToUpper() }

# OK: for very small, non-performance-critical operations
# But in any loop or pipeline — use [PSCustomObject]
```

## See Also

- [cmd-consistent-output](cmd-consistent-output.md) - Consistent object types
- [perf-pipeline-over-loops](perf-pipeline-over-loops.md) - Pipeline performance
