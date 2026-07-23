# test-arrange-act-assert

> Structure every test as Arrange / Act / Assert, with clear separation between the three phases

## Why It Matters

Tests that interleave setup, invocation, and assertions are hard to scan quickly - a reviewer (or your future self) has to mentally untangle what's part of the setup versus what's actually being verified. Consistent Arrange/Act/Assert structure, ideally with blank lines or comments marking the phases, makes every test predictable to read regardless of who wrote it.

## Bad

```csharp
[Fact]
public void ProcessesOrderCorrectly()
{
    var gateway = Substitute.For<IPaymentGateway>();
    gateway.ChargeAsync(Arg.Any<decimal>()).Returns(true);
    var processor = new OrderProcessor(gateway);
    var order = new Order { Total = 100m };
    var result = processor.Process(order);
    Assert.True(result);
    gateway.Received(1).ChargeAsync(100m);
    var order2 = new Order { Total = 50m }; // second scenario mixed into the same test, unclear boundary
    var result2 = processor.Process(order2);
    Assert.True(result2);
}
```

## Good

```csharp
[Fact]
public void Process_ChargesGatewayForOrderTotal()
{
    // Arrange
    var gateway = Substitute.For<IPaymentGateway>();
    gateway.ChargeAsync(Arg.Any<decimal>()).Returns(true);
    var processor = new OrderProcessor(gateway);
    var order = new Order { Total = 100m };

    // Act
    var result = processor.Process(order);

    // Assert
    Assert.True(result);
    gateway.Received(1).ChargeAsync(100m);
}

[Fact]
public void Process_ReturnsFalse_WhenGatewayDeclines()
{
    // Arrange
    var gateway = Substitute.For<IPaymentGateway>();
    gateway.ChargeAsync(Arg.Any<decimal>()).Returns(false);
    var processor = new OrderProcessor(gateway);
    var order = new Order { Total = 50m };

    // Act
    var result = processor.Process(order);

    // Assert
    Assert.False(result);
}
```

## Shared Arrange Logic via Constructor/Fixture

```csharp
public class OrderProcessorTests
{
    private readonly IPaymentGateway _gateway = Substitute.For<IPaymentGateway>();
    private readonly OrderProcessor _processor;

    public OrderProcessorTests() // xUnit: runs before EVERY test method - fresh instance each time
    {
        _processor = new OrderProcessor(_gateway);
    }

    [Fact]
    public void Process_ChargesGatewayForOrderTotal()
    {
        // Arrange (test-specific part only)
        _gateway.ChargeAsync(Arg.Any<decimal>()).Returns(true);

        // Act
        var result = _processor.Process(new Order { Total = 100m });

        // Assert
        Assert.True(result);
    }
}
```

## See Also

- [test-descriptive-test-names](test-descriptive-test-names.md) - Naming what's being verified
- [test-one-assert-concept](test-one-assert-concept.md) - Keeping each test focused on one behavior
