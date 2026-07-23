# test-xunit-theory-inlinedata

> Use `[Theory]`/`[InlineData]` (or `[MemberData]`/`[ClassData]`) for parameterized tests instead of copy-pasted `[Fact]` methods

## Why It Matters

Copy-pasting a test method for every input variation duplicates the arrange/act/assert logic and makes it easy for the copies to drift out of sync. `[Theory]` with `[InlineData]` runs the same test body against multiple inputs, each reported as an individually named, individually failing test case in the test explorer/CI output.

## Bad

```csharp
public class DiscountCalculatorTests
{
    [Fact]
    public void Calculates10PercentDiscount()
    {
        var result = DiscountCalculator.Apply(100m, 0.10m);
        Assert.Equal(90m, result);
    }

    [Fact]
    public void Calculates25PercentDiscount()
    {
        var result = DiscountCalculator.Apply(100m, 0.25m);
        Assert.Equal(75m, result);
    }
    // Same logic, duplicated for every case
}
```

## Good

```csharp
public class DiscountCalculatorTests
{
    [Theory]
    [InlineData(100, 0.10, 90)]
    [InlineData(100, 0.25, 75)]
    [InlineData(50, 0.50, 25)]
    public void Apply_ReturnsDiscountedAmount(decimal price, decimal discount, decimal expected)
    {
        var result = DiscountCalculator.Apply(price, discount);
        Assert.Equal(expected, result);
    }
}
```

## MemberData for Complex or Reusable Test Data

```csharp
public class DiscountCalculatorTests
{
    public static IEnumerable<object[]> DiscountCases =>
    [
        [100m, 0.10m, 90m],
        [100m, 0.25m, 75m],
        [50m, 0.50m, 25m]
    ];

    [Theory]
    [MemberData(nameof(DiscountCases))]
    public void Apply_ReturnsDiscountedAmount(decimal price, decimal discount, decimal expected)
    {
        Assert.Equal(expected, DiscountCalculator.Apply(price, discount));
    }
}
```

## ClassData for Shared, Strongly-Typed Data Across Test Classes

```csharp
public class DiscountTestData : TheoryData<decimal, decimal, decimal>
{
    public DiscountTestData()
    {
        Add(100m, 0.10m, 90m);
        Add(100m, 0.25m, 75m);
    }
}

[Theory]
[ClassData(typeof(DiscountTestData))]
public void Apply_ReturnsDiscountedAmount(decimal price, decimal discount, decimal expected) =>
    Assert.Equal(expected, DiscountCalculator.Apply(price, discount));
```

## See Also

- [test-descriptive-test-names](test-descriptive-test-names.md) - Naming theory-generated test cases clearly
- [test-arrange-act-assert](test-arrange-act-assert.md) - Structuring the test body itself
