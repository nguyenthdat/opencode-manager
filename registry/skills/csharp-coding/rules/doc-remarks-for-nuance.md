# doc-remarks-for-nuance

> Use `<remarks>` for behavioral nuance, performance notes, and caveats that don't belong in a one-line `<summary>`

## Why It Matters

`<summary>` should stay a single, scannable sentence - IntelliSense truncates or de-emphasizes longer summaries in some tooling. `<remarks>` is the right place for everything else a caller might need to know: threading behavior, performance characteristics, historical context, or edge cases - without bloating the primary description.

## Bad

```csharp
/// <summary>
/// Retrieves a cached value by key. Note that this method is NOT thread-safe
/// when TCache is a mutable type, and repeated calls with the same key within
/// a single request are memoized for the lifetime of the current HttpContext,
/// but this memoization is cleared between requests, and under high contention
/// this may fall back to a slower synchronized path - see the internal
/// implementation for details on the locking strategy used.
/// </summary>
public T? Get<T>(string key) => default;
// Wall of text in the summary - buries the actual one-line purpose
```

## Good

```csharp
/// <summary>Retrieves a cached value by key.</summary>
/// <remarks>
/// <para>
/// Results are memoized for the lifetime of the current <see cref="HttpContext"/>
/// and cleared between requests.
/// </para>
/// <para>
/// This method is not thread-safe when <typeparamref name="T"/> is a mutable
/// type; under high contention, lookups may fall back to a slower synchronized
/// path.
/// </para>
/// </remarks>
/// <typeparam name="T">The type of the cached value.</typeparam>
/// <param name="key">The cache key.</param>
public T? Get<T>(string key) => default;
```

## Performance Notes Belong in Remarks Too

```csharp
/// <summary>Sorts the collection in place.</summary>
/// <remarks>
/// Uses an introspective sort (O(n log n) average case) and is NOT stable -
/// elements that compare as equal may be reordered. Use
/// <see cref="Enumerable.OrderBy{TSource,TKey}"/> if stability is required.
/// </remarks>
public void SortInPlace() { }
```

## See Also

- [doc-xml-summary-public](doc-xml-summary-public.md) - The primary, one-line description
- [linq-orderby-stable](linq-orderby-stable.md) - The stability nuance referenced in the example
