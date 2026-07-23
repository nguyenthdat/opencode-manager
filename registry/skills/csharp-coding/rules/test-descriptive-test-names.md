# test-descriptive-test-names

> Name tests `MethodUnderTest_Scenario_ExpectedResult` (or an equally descriptive convention) so failures are self-explanatory

## Why It Matters

A failing test named `Test1` or `ProcessOrder_Test` tells you nothing from the CI output - you have to open the test file to understand what broke. A descriptive name states the method under test, the scenario, and the expected outcome, so a failure report alone often tells you exactly what regressed.

## Bad

```csharp
[Fact]
public void Test1()
{
    var result = DiscountCalculator.Apply(100m, 1.5m);
    Assert.Throws<ArgumentOutOfRangeException>(() => DiscountCalculator.Apply(100m, 1.5m));
}

[Fact]
public void TestDiscount()
{
    var result = DiscountCalculator.Apply(100m, 0.1m);
    Assert.Equal(90m, result);
}
```

## Good

```csharp
[Fact]
public void Apply_ThrowsArgumentOutOfRangeException_WhenDiscountExceeds100Percent()
{
    Assert.Throws<ArgumentOutOfRangeException>(() => DiscountCalculator.Apply(100m, 1.5m));
}

[Fact]
public void Apply_ReturnsDiscountedAmount_When10PercentDiscountApplied()
{
    var result = DiscountCalculator.Apply(100m, 0.1m);
    Assert.Equal(90m, result);
}
```

## Alternative Convention: "Should" Phrasing

```csharp
// Some teams prefer a "should" style, which reads well with BDD-flavored frameworks
[Fact]
public void ShouldThrowWhenDiscountExceeds100Percent() { /* ... */ }

[Fact]
public void ShouldReturnDiscountedAmountForValidPercentage() { /* ... */ }
```

## Consistency Matters More Than the Exact Convention

```text
Pick ONE convention (MethodUnderTest_Scenario_Expected, Should*, or Given_When_Then)
and apply it consistently across the codebase - a mix of styles is nearly as
confusing as no convention at all. Document the choice in a contributing guide
or test-project README.
```

## Parameterized Test Names

```csharp
// xUnit auto-generates a display name per InlineData row including the argument
// values, e.g. "Apply_ReturnsDiscountedAmount(price: 100, discount: 0.1, expected: 90)"
[Theory]
[InlineData(100, 0.1, 90)]
public void Apply_ReturnsDiscountedAmount(decimal price, decimal discount, decimal expected) =>
    Assert.Equal(expected, DiscountCalculator.Apply(price, discount));
```

## See Also

- [test-arrange-act-assert](test-arrange-act-assert.md) - Structuring the test body
- [test-xunit-theory-inlinedata](test-xunit-theory-inlinedata.md) - Parameterized test naming in practice
