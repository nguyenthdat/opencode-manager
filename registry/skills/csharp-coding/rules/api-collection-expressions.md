# api-collection-expressions

> Use collection expressions (`[1, 2, 3]`, C# 12+) for collection literals instead of verbose constructor syntax

## Why It Matters

Collection expressions give every collection type (arrays, `List<T>`, `Span<T>`, and any type with a compatible constructor pattern or `[CollectionBuilder]` attribute) one consistent, terse literal syntax. They also let the compiler pick the most efficient underlying representation, and the spread operator (`..`) replaces manual `AddRange`/`Concat` calls.

## Bad

```csharp
int[] numbers = new int[] { 1, 2, 3 };
List<string> names = new List<string> { "Ada", "Grace" };
var combined = new List<string>();
combined.AddRange(names);
combined.Add("Linus");

ImmutableArray<int> immutable = ImmutableArray.Create(1, 2, 3);
```

## Good

```csharp
int[] numbers = [1, 2, 3];
List<string> names = ["Ada", "Grace"];
List<string> combined = [..names, "Linus"]; // spread operator inlines existing sequences

ImmutableArray<int> immutable = [1, 2, 3]; // works for any type supporting collection expressions

// Empty collection literal
List<int> empty = [];

// Works for method arguments and return values too
ProcessAll([1, 2, 3]);
int[] GetDefaults() => [10, 20, 30];
```

## Combining Spreads

```csharp
int[] first = [1, 2, 3];
int[] second = [4, 5, 6];
int[] merged = [..first, ..second, 7]; // [1, 2, 3, 4, 5, 6, 7]
```

## Span and ReadOnlySpan Literals

```csharp
// Collection expressions also target Span<T>/ReadOnlySpan<T> for stack-allocated,
// allocation-free literals in the right contexts
void Process(ReadOnlySpan<int> values) { /* ... */ }
Process([1, 2, 3]); // compiler may use stackalloc-backed storage here
```

## See Also

- [type-pattern-matching-is](type-pattern-matching-is.md) - Another C# 12/13-era pattern-matching feature
- [immut-immutable-collections](immut-immutable-collections.md) - Choosing the right collection type
- [linq-collection-choice](linq-collection-choice.md) - Choosing collection types by access pattern
