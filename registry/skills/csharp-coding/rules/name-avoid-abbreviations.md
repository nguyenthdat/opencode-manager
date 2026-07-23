# name-avoid-abbreviations

> Avoid unclear or inconsistent abbreviations in public API names

## Why It Matters

An abbreviation that's obvious to the author (`Qty`, `Amt`, `Mgr`) is often ambiguous to everyone else, and different developers abbreviate the same word differently across a codebase (`Qty` vs `Quant` vs `Count`), fragmenting naming consistency. Full words are unambiguous, and modern IDEs make the extra characters essentially free to type (autocomplete).

## Bad

```csharp
public class OrdProc // "OrderProcessor"? "OrderProcedure"? unclear
{
    public decimal CalcTotAmt(int qty, decimal unitPx) // CalcTotAmt, qty, unitPx - all cryptic
    {
        return qty * unitPx;
    }

    public CustMgr Mgr { get; set; } // "CustomerManager"? "CustomerManagerService"?
}
```

## Good

```csharp
public class OrderProcessor
{
    public decimal CalculateTotalAmount(int quantity, decimal unitPrice)
    {
        return quantity * unitPrice;
    }

    public CustomerManager Manager { get; set; }
}
```

## Well-Known Abbreviations Are Fine

```csharp
// Universally recognized acronyms/abbreviations in the .NET ecosystem and
// broader industry are acceptable - see name-acronym-word for casing rules.
public class HttpClientFactory { }
public string Id { get; init; }
public Uri ApiEndpoint { get; init; }
public int MaxDop { get; init; } // borderline - consider MaxDegreeOfParallelism for clarity instead
```

## Loop Variables Are a Narrow, Accepted Exception

```csharp
// Single-letter loop indices are conventional and don't need expansion
for (var i = 0; i < items.Count; i++) { /* ... */ }
foreach (var (key, value) in dictionary) { /* ... */ } // deconstructed names, already clear
```

## See Also

- [name-pascalcase-public](name-pascalcase-public.md) - General naming conventions
- [name-generic-type-param-t](name-generic-type-param-t.md) - Where single-letter names ARE the convention
