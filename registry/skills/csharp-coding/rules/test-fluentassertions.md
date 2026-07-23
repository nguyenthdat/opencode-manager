# test-fluentassertions

> Use FluentAssertions (or a similar fluent assertion library) for more readable, more descriptive test failures

## Why It Matters

Standard `Assert.Equal(expected, actual)` failure messages are often minimal ("Expected: 5, Actual: 3"). Fluent assertion libraries produce specific, contextual failure messages (which property differed, what the collection actually contained) and read closer to natural language at the call site, making both the test and its failure output easier to understand.

## Bad

```csharp
[Fact]
public void CreatesOrderWithCorrectTotal()
{
    var order = OrderFactory.Create(items);

    Assert.Equal(3, order.Lines.Count);
    Assert.True(order.Total > 0);
    Assert.Equal("Pending", order.Status.ToString());
    // On failure: "Expected: 3, Actual: 2" - which property? which order? no context.
}
```

## Good

```csharp
[Fact]
public void CreatesOrderWithCorrectTotal()
{
    var order = OrderFactory.Create(items);

    order.Lines.Should().HaveCount(3);
    order.Total.Should().BePositive();
    order.Status.Should().Be(OrderStatus.Pending);
    // On failure: "Expected order.Lines to contain 3 item(s), but found 2: {...}"
}
```

## Object Graph Comparisons

```csharp
[Fact]
public void MapsDtoToEntityCorrectly()
{
    var dto = new OrderDto { Id = 1, CustomerName = "Ada" };

    var entity = OrderMapper.ToEntity(dto);

    entity.Should().BeEquivalentTo(new Order { Id = 1, CustomerName = "Ada" });
    // Compares property-by-property and reports EXACTLY which property differs on failure
}
```

## Exception Assertions

```csharp
[Fact]
public void ThrowsWhenTotalIsNegative()
{
    var act = () => new Order(total: -10m);

    act.Should().Throw<ArgumentOutOfRangeException>()
        .WithParameterName("total");
}
```

## Async Assertions

```csharp
[Fact]
public async Task ChargeAsync_ThrowsOnDeclinedCard()
{
    Func<Task> act = () => _gateway.ChargeAsync(-1m);

    await act.Should().ThrowAsync<ArgumentException>();
}
```

## See Also

- [test-arrange-act-assert](test-arrange-act-assert.md) - Where assertions fit in test structure
- [test-descriptive-test-names](test-descriptive-test-names.md) - Complementary readability practice
