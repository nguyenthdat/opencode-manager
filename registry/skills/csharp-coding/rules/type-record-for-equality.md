# type-record-for-equality

> Use a record instead of hand-writing `Equals`/`GetHashCode`/`==` overrides

## Why It Matters

Hand-written value equality is easy to get subtly wrong: forgetting a field when one is added later, an inconsistent `GetHashCode` (not matching `Equals`), or forgetting to override `==`/`!=` alongside `Equals`. A record generates all of this correctly and automatically, from a single declaration.

## Bad

```csharp
public class Coordinates
{
    public double Latitude { get; }
    public double Longitude { get; }

    public Coordinates(double latitude, double longitude) =>
        (Latitude, Longitude) = (latitude, longitude);

    public override bool Equals(object? obj) =>
        obj is Coordinates other && Latitude == other.Latitude && Longitude == other.Longitude;

    public override int GetHashCode() => HashCode.Combine(Latitude, Longitude);

    // Forgot to override == and != - reference equality sneaks back in for operator use:
    // coord1 == coord2 uses REFERENCE equality here, while coord1.Equals(coord2) uses VALUE equality!
}
```

## Good

```csharp
public record Coordinates(double Latitude, double Longitude);
// Equals, GetHashCode, ==, !=, ToString, and Deconstruct are ALL generated
// consistently - no risk of == and .Equals() disagreeing.

var a = new Coordinates(51.5, -0.12);
var b = new Coordinates(51.5, -0.12);
Console.WriteLine(a == b);        // True
Console.WriteLine(a.Equals(b));   // True - consistent with ==
```

## When You Still Need Custom Equality Logic

```csharp
// A record can override the generated Equals for custom comparison semantics
// (e.g. case-insensitive string comparison) while keeping everything else generated.
public record EmailAddress(string Value)
{
    public virtual bool Equals(EmailAddress? other) =>
        other is not null && string.Equals(Value, other.Value, StringComparison.OrdinalIgnoreCase);

    public override int GetHashCode() => Value.ToLowerInvariant().GetHashCode();
}
```

## See Also

- [immut-record-equality](immut-record-equality.md) - Understanding what "value equality" means for records
- [api-record-value-data](api-record-value-data.md) - Records overview
