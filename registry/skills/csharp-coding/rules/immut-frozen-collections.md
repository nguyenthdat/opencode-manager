# immut-frozen-collections

> Use `FrozenDictionary<K,V>`/`FrozenSet<T>` (.NET 8+) for collections built once and read many times

## Why It Matters

`FrozenDictionary`/`FrozenSet` invest extra time up front (at creation) to build a lookup structure optimized purely for read performance - faster lookups than a regular `Dictionary`/`HashSet` at the cost of slower construction and no further mutation. They're a precise fit for static lookup tables, configuration snapshots, and other build-once/read-forever data.

## Bad

```csharp
public static class CountryCodes
{
    // Rebuilt (or held as a regular Dictionary) even though it never changes
    // after startup and is looked up on every request.
    public static readonly Dictionary<string, string> Names = new()
    {
        ["US"] = "United States",
        ["CA"] = "Canada",
        // ... hundreds more
    };
}
```

## Good

```csharp
public static class CountryCodes
{
    public static readonly FrozenDictionary<string, string> Names =
        new Dictionary<string, string>
        {
            ["US"] = "United States",
            ["CA"] = "Canada",
            // ... hundreds more
        }.ToFrozenDictionary();
}

// Lookups are as fast or faster than Dictionary<K,V>, with no mutation API to misuse
if (CountryCodes.Names.TryGetValue(code, out var name))
{
    Use(name);
}
```

## FrozenSet for Membership Checks

```csharp
private static readonly FrozenSet<string> ReservedNames =
    new[] { "admin", "root", "system" }.ToFrozenSet(StringComparer.OrdinalIgnoreCase);

public bool IsReserved(string name) => ReservedNames.Contains(name);
```

## When Not to Use Frozen Collections

```text
- Data that changes at runtime (even infrequently) - Frozen collections have no
  mutation API at all; you'd need to rebuild and swap the whole reference.
- Small collections or ones only queried a handful of times - the extra
  construction cost isn't worth it; a regular Dictionary/HashSet is simpler and fine.
- Always measure: the benefit is specific to lookup-heavy, rarely-rebuilt data.
```

## See Also

- [immut-immutable-collections](immut-immutable-collections.md) - The general immutable-collections family
- [perf-frozen-lookup-startup](perf-frozen-lookup-startup.md) - Performance-focused deep dive
