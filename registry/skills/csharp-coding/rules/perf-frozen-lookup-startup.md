# perf-frozen-lookup-startup

> Use `FrozenDictionary`/`FrozenSet` for startup-built, read-many lookup tables on the hot request path

## Why It Matters

A regular `Dictionary<K,V>` is optimized for a balance of insert and lookup performance. `FrozenDictionary`/`FrozenSet` (.NET 8+) trade slower, one-time construction for measurably faster lookups afterward - exactly the right tradeoff for reference/configuration data built once at startup and then read on every request for the rest of the process's lifetime.

## Bad

```csharp
public class RouteTable
{
    // Rebuilt or held as a plain Dictionary even though it's fixed after startup
    // and queried on every single incoming request.
    private readonly Dictionary<string, RouteHandler> _routes;

    public RouteTable(IEnumerable<(string Path, RouteHandler Handler)> routes) =>
        _routes = routes.ToDictionary(r => r.Path, r => r.Handler);

    public RouteHandler? Resolve(string path) => _routes.GetValueOrDefault(path);
}
```

## Good

```csharp
public class RouteTable
{
    private readonly FrozenDictionary<string, RouteHandler> _routes;

    public RouteTable(IEnumerable<(string Path, RouteHandler Handler)> routes) =>
        _routes = routes.ToFrozenDictionary(r => r.Path, r => r.Handler);

    public RouteHandler? Resolve(string path) => _routes.GetValueOrDefault(path);
    // Lookups on the hot request path are now as fast as or faster than Dictionary<K,V>
}
```

## Measure the Break-Even Point

```text
FrozenDictionary's construction cost is higher than Dictionary's - it's only
a net win when the collection is built rarely (ideally once) and queried very
often. For a small collection queried only a handful of times, a regular
Dictionary (or even a simple array + linear scan) may be equally fast or faster.
Benchmark your specific size/access-pattern before committing.
```

## Combining With Dependency Injection as a Singleton

```csharp
builder.Services.AddSingleton<RouteTable>(sp =>
{
    var routes = sp.GetRequiredService<IEnumerable<RouteDefinition>>()
        .Select(r => (r.Path, r.Handler));
    return new RouteTable(routes); // built once at startup, shared for the app's lifetime
});
```

## See Also

- [immut-frozen-collections](immut-frozen-collections.md) - The immutability-category treatment of frozen collections
- [linq-collection-choice](linq-collection-choice.md) - Choosing collections generally
