# test-one-assert-concept

> Test one logical behavior/concept per test method, even if that means multiple `Assert` calls

## Why It Matters

A test that verifies several unrelated behaviors at once fails ambiguously - a single failing assertion partway through tells you *something* is wrong, but a reader must scroll through everything before it to understand which behavior actually broke, and a single unrelated regression can mask a completely different one after it (since execution stops at the first failed assertion).

## Bad

```csharp
[Fact]
public void OrderProcessorWorks()
{
    var processor = new OrderProcessor(gateway);

    var order = processor.CreateOrder(items);
    Assert.NotNull(order);

    var result = processor.Process(order);
    Assert.True(result);

    processor.Cancel(order);
    Assert.Equal(OrderStatus.Cancelled, order.Status);
    // Three unrelated behaviors (creation, processing, cancellation) in one test -
    // a failure in "creation" masks whether "processing" or "cancellation" still work.
}
```

## Good

```csharp
[Fact]
public void CreateOrder_ReturnsNonNullOrder()
{
    var processor = new OrderProcessor(gateway);
    var order = processor.CreateOrder(items);
    Assert.NotNull(order);
}

[Fact]
public void Process_ReturnsTrue_WhenGatewayApproves()
{
    var processor = new OrderProcessor(gateway);
    var order = processor.CreateOrder(items);
    var result = processor.Process(order);
    Assert.True(result);
}

[Fact]
public void Cancel_SetsStatusToCancelled()
{
    var processor = new OrderProcessor(gateway);
    var order = processor.CreateOrder(items);
    processor.Cancel(order);
    Assert.Equal(OrderStatus.Cancelled, order.Status);
}
```

## Multiple Asserts ARE Fine When Verifying One Concept

```csharp
// This is still "one behavior" - checking several facets of the SAME outcome -
// so multiple asserts here don't violate the rule.
[Fact]
public void CreateOrder_PopulatesExpectedFields()
{
    var order = processor.CreateOrder(items);

    Assert.NotNull(order);
    Assert.Equal(items.Count, order.Lines.Count);
    Assert.Equal(OrderStatus.Pending, order.Status);
    // All three asserts describe ONE concept: "creation populates the order correctly"
}
```

## See Also

- [test-arrange-act-assert](test-arrange-act-assert.md) - Structuring the test body
- [test-descriptive-test-names](test-descriptive-test-names.md) - Naming reflects the single behavior under test
