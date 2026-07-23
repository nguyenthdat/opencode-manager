# immut-with-nondestructive-mutation

> Use `with` expressions instead of manual copy constructors for non-destructive updates

## Why It Matters

Before records, producing an "updated copy" of an immutable object meant writing (and maintaining) a copy constructor or a set of `WithX` methods by hand - one more thing to keep in sync every time a property is added. `with` expressions do this automatically for any `record`/`record struct`, and can be added to plain classes via a manually-implemented clone method only when records aren't a fit.

## Bad

```csharp
public class Config
{
    public string Environment { get; }
    public int MaxConnections { get; }
    public bool VerboseLogging { get; }

    public Config(string environment, int maxConnections, bool verboseLogging) =>
        (Environment, MaxConnections, VerboseLogging) = (environment, maxConnections, verboseLogging);

    // Hand-written, and must be updated every time a property is added
    public Config WithVerboseLogging(bool verbose) =>
        new(Environment, MaxConnections, verbose);
}
```

## Good

```csharp
public record Config(string Environment, int MaxConnections, bool VerboseLogging);

var config = new Config("production", 100, false);
var debugConfig = config with { VerboseLogging = true }; // no per-property method needed

// Adding a new property later requires zero changes to any "with"-style call site
public record ConfigV2(string Environment, int MaxConnections, bool VerboseLogging, string Region);
```

## Chaining Multiple `with` Updates

```csharp
var updated = config with { MaxConnections = 200 } with { VerboseLogging = true };
// Equivalent, and usually clearer, as a single expression:
var updated2 = config with { MaxConnections = 200, VerboseLogging = true };
```

## See Also

- [api-with-expression-nondestructive](api-with-expression-nondestructive.md) - Deeper look at `with`, including shallow-copy caveats
- [api-record-value-data](api-record-value-data.md) - Records overview
- [immut-record-struct-small-value](immut-record-struct-small-value.md) - `with` on value-type records
