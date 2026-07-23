# perf-string-comparison-ordinal

> Use `StringComparison.Ordinal`/`OrdinalIgnoreCase` for non-linguistic string comparisons

## Why It Matters

Default string comparison methods (`string.Equals`, `==` on some overloads' culture-aware paths, `.ToLower()`) can apply culture-sensitive linguistic rules, which are both slower than a byte-for-byte ordinal comparison and semantically wrong for things that aren't natural-language text (identifiers, file paths, HTTP headers, dictionary keys, enum names). `StringComparison.Ordinal` is faster and avoids surprising culture-dependent behavior (like the notorious Turkish "I" problem).

## Bad

```csharp
public bool IsAdminRole(string role)
{
    return role.ToLower() == "admin"; // culture-sensitive lowercasing - slow, and wrong in tr-TR culture
    // In Turkish culture, "I".ToLower() produces "ı" (dotless i), not "i" -
    // this comparison can silently fail in a way that's invisible in most dev/test environments.
}
```

## Good

```csharp
public bool IsAdminRole(string role) =>
    string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase); // fast, culture-independent
```

## Ordinal for Exact/Technical Comparisons

```csharp
public bool IsSameFilePath(string a, string b) =>
    string.Equals(a, b, StringComparison.OrdinalIgnoreCase); // OS-path-style comparison, not linguistic

public bool StartsWithPrefix(string value, string prefix) =>
    value.StartsWith(prefix, StringComparison.Ordinal); // e.g. checking a namespace/identifier prefix
```

## Culture-Aware Comparison IS Correct for User-Facing Text

```csharp
// Sorting a list of customer-facing display names for a UI SHOULD use
// culture-aware comparison so it sorts the way a human reader of that
// culture expects.
var sorted = names.OrderBy(n => n, StringComparer.CurrentCulture);
```

## Dictionary/HashSet Keys

```csharp
// Specify the comparer explicitly for collection keys too - the default
// Dictionary<string,V> uses ordinal comparison already, but being explicit
// documents intent and avoids surprises with custom equality needs.
var lookup = new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase);
```

## See Also

- [linq-orderby-stable](linq-orderby-stable.md) - Sorting behavior, including culture-aware cases
- [type-strongly-typed-ids](type-strongly-typed-ids.md) - Avoiding string-keyed lookups altogether where possible
