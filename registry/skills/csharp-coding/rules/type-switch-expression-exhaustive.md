# type-switch-expression-exhaustive

> Use switch expressions and let the compiler help enforce exhaustiveness for enums and closed type hierarchies

## Why It Matters

A `switch` *expression* (as opposed to the older `switch` statement) requires every path to produce a value, and the compiler warns (CS8509) when an enum switch doesn't cover every defined member. Combined with a discard arm that throws, this turns "forgot to handle a new enum case" from a silent runtime bug into either a build warning or an informative runtime exception at the exact right spot.

## Bad

```csharp
public decimal GetDiscountRate(CustomerTier tier)
{
    if (tier == CustomerTier.Bronze) return 0.0m;
    if (tier == CustomerTier.Silver) return 0.05m;
    if (tier == CustomerTier.Gold) return 0.10m;
    return 0.0m; // silent fallback - adding CustomerTier.Platinum later is invisible here
}
```

## Good

```csharp
public decimal GetDiscountRate(CustomerTier tier) => tier switch
{
    CustomerTier.Bronze => 0.0m,
    CustomerTier.Silver => 0.05m,
    CustomerTier.Gold => 0.10m,
    _ => throw new ArgumentOutOfRangeException(nameof(tier), tier, "Unhandled customer tier.")
    // Adding CustomerTier.Platinum later: the compiler emits CS8509 ("switch does
    // not handle all possible values") if the discard arm above is removed, or
    // throws loudly at runtime here instead of silently returning 0.0m.
};
```

## Exhaustive Without a Discard Arm

```csharp
// If every enum member is explicitly handled, the compiler considers the switch
// exhaustive and no discard arm - and no CS8509 warning - is needed at all.
public string TierName(CustomerTier tier) => tier switch
{
    CustomerTier.Bronze => "Bronze",
    CustomerTier.Silver => "Silver",
    CustomerTier.Gold => "Gold"
    // No discard needed here IF CustomerTier has exactly these three members -
    // adding a member later brings back the CS8509 warning, prompting a fix.
};
```

## Exhaustiveness Over Sealed Type Hierarchies

```csharp
public abstract record Shape;
public sealed record Circle(double Radius) : Shape;
public sealed record Rectangle(double Width, double Height) : Shape;

public double Area(Shape shape) => shape switch
{
    Circle c => Math.PI * c.Radius * c.Radius,
    Rectangle r => r.Width * r.Height,
    _ => throw new NotSupportedException($"Unknown shape: {shape.GetType()}")
    // The compiler doesn't (yet) prove exhaustiveness over sealed record hierarchies
    // the way it does for enums - keep the throwing discard arm as a safety net.
};
```

## See Also

- [type-pattern-matching-is](type-pattern-matching-is.md) - Pattern matching fundamentals
- [type-enum-design](type-enum-design.md) - Designing the enums being switched over
