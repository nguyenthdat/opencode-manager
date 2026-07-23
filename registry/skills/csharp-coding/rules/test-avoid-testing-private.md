# test-avoid-testing-private

> Test through the class's public API, not by reaching into private implementation details

## Why It Matters

Tests coupled to private methods/fields (via reflection, `InternalsVisibleTo` abuse, or making things `internal`/`public` purely so tests can reach them) break every time you refactor the implementation, even when the observable behavior hasn't changed. Testing through the public contract means tests verify what actually matters - behavior - and survive internal refactors.

## Bad

```csharp
public class DiscountCalculator
{
    private decimal CalculateBaseRate(CustomerTier tier) => tier switch
    {
        CustomerTier.Gold => 0.10m,
        _ => 0.0m
    };

    public decimal Apply(decimal price, CustomerTier tier) => price * (1 - CalculateBaseRate(tier));
}

[Fact]
public void CalculateBaseRate_ReturnsCorrectRateForGold()
{
    var calculator = new DiscountCalculator();

    // Reflection to reach a private method - breaks the moment the method is
    // renamed, inlined, or restructured, even if Apply()'s behavior is unchanged.
    var method = typeof(DiscountCalculator).GetMethod("CalculateBaseRate",
        BindingFlags.NonPublic | BindingFlags.Instance)!;
    var rate = (decimal)method.Invoke(calculator, [CustomerTier.Gold])!;

    Assert.Equal(0.10m, rate);
}
```

## Good

```csharp
[Fact]
public void Apply_AppliesGoldTierDiscount()
{
    var calculator = new DiscountCalculator();

    var result = calculator.Apply(100m, CustomerTier.Gold);

    Assert.Equal(90m, result); // verifies the OBSERVABLE, public behavior
}
```

## When a "Private Detail" Deserves Its Own Public Test Surface

```csharp
// If a private algorithm is complex enough to deserve its own focused tests,
// that's a signal it should be extracted into its own class with a real
// public API - not tested via reflection into the original class.
public interface IDiscountRateProvider
{
    decimal GetRate(CustomerTier tier);
}

public class TieredDiscountRateProvider : IDiscountRateProvider
{
    public decimal GetRate(CustomerTier tier) => tier switch
    {
        CustomerTier.Gold => 0.10m,
        _ => 0.0m
    };
}

[Fact]
public void GetRate_ReturnsGoldTierRate()
{
    var provider = new TieredDiscountRateProvider();
    Assert.Equal(0.10m, provider.GetRate(CustomerTier.Gold)); // tests a real public API now
}
```

## See Also

- [test-arrange-act-assert](test-arrange-act-assert.md) - Structuring behavior-focused tests
- [api-interface-segregation](api-interface-segregation.md) - Extracting a testable public seam
