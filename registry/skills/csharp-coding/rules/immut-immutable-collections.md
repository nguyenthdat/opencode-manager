# immut-immutable-collections

> Use `System.Collections.Immutable` types for collections that are shared, cached, or exposed across boundaries

## Why It Matters

A `List<T>`/`Dictionary<K,V>` field, even behind a `readonly` reference, can still be mutated through its contents by anyone holding a reference to it. `ImmutableArray<T>`, `ImmutableList<T>`, `ImmutableDictionary<K,V>`, etc. guarantee that once constructed, the collection's contents can never change - critical for thread-safe sharing and for records/value objects that must stay truly immutable.

## Bad

```csharp
public class FeatureFlags
{
    public List<string> Enabled { get; }

    public FeatureFlags(List<string> enabled) => Enabled = enabled;
}

var source = new List<string> { "beta-ui" };
var flags = new FeatureFlags(source);

source.Add("beta-search"); // mutates the SAME list the FeatureFlags instance is holding
// flags.Enabled now unexpectedly contains "beta-search" too - shared mutable state bug
```

## Good

```csharp
public class FeatureFlags
{
    public ImmutableArray<string> Enabled { get; }

    public FeatureFlags(IEnumerable<string> enabled) => Enabled = [..enabled];
}

var source = new List<string> { "beta-ui" };
var flags = new FeatureFlags(source);

source.Add("beta-search"); // has no effect on flags.Enabled - it copied the values at construction
```

## Choosing an Immutable Collection Type

```csharp
ImmutableArray<T>      // best raw performance for read-heavy, indexable, fixed-size data
ImmutableList<T>       // efficient structural sharing for collections that are "modified" via with-like operations
ImmutableDictionary<K,V>
ImmutableHashSet<T>
FrozenDictionary<K,V>  // .NET 8+, optimized for build-once/read-many (see immut-frozen-collections)
```

## Builders for Efficient Construction

```csharp
// Building an immutable collection element-by-element via .Add() in a loop
// creates a new collection on every call - use a Builder to batch the work.
var builder = ImmutableList.CreateBuilder<string>();
foreach (var name in names)
{
    builder.Add(name.ToUpperInvariant());
}
ImmutableList<string> result = builder.ToImmutable();
```

## See Also

- [immut-frozen-collections](immut-frozen-collections.md) - The read-optimized variant
- [immut-defensive-copy-collections](immut-defensive-copy-collections.md) - The alternative when you can't change the field type
- [api-expose-interfaces-not-impls](api-expose-interfaces-not-impls.md) - Related public-API encapsulation rule
