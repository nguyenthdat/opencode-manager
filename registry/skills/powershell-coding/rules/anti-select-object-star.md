# anti-select-object-star

> Don't use Select-Object \* for exploring; use Get-Member

## Why It Matters

`Select-Object *` enumerates all properties of every object in the pipeline, which is slow and memory-intensive for objects with many properties (like WMI or AD objects). `Get-Member` inspects the type definition without instantiating all values, providing the same information faster and more reliably.

## Bad

```powershell
# Slow, shows values but loses type info
Get-Process | Select-Object -First 1 * | Format-List
# Enumerates all 50+ properties for each process — slow
# Shows values but doesn't show methods, ScriptProperties, ETS members

# Also bad: Select-Object * for discovering properties
Get-ADUser jdoe | Select-Object *  # 200+ properties enumerated
```

## Good

```powershell
# Fast: shows type definition without enumerating all values
Get-Process | Get-Member
# Shows:
# - Property types
# - Methods
# - ScriptProperties (calculated)
# - NoteProperties (extended)
# - MemberType (Property vs AliasProperty vs ScriptProperty)

# Show specific member types
Get-Process | Get-Member -MemberType Property
Get-Process | Get-Member -MemberType Method
Get-Process | Get-Member -MemberType ScriptProperty

# Find properties matching a name
Get-ADUser jdoe -Properties * | Get-Member -Name '*Phone*'
```

## Exploring Objects Correctly

```powershell
# 1. Get-Member to see what properties exist
Get-CommandInfo Get-Process | Get-Member

# 2. Select specific properties to see values
Get-Process | Select-Object -First 1 Name, CPU, WorkingSet | Format-List

# 3. For discovering properties by name pattern
Get-Process | Get-Member -Name '*Memory*'

# 4. For discovering available methods
Get-Process | Get-Member -MemberType Method

# NEVER: ... | Select-Object *  # Enumerates everything — slow!
```

## See Also

- [pipe-select-object-last](pipe-select-object-last.md) - Select late
- [cmd-consistent-output](cmd-consistent-output.md) - Consistent output types
