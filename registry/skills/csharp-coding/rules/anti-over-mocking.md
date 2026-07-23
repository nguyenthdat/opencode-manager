# anti-over-mocking

> Don't over-mock; mock only genuine external boundaries, not every collaborator

## Why It Matters

Mocking every single dependency - including simple value objects, pure functions, or in-process collaborators with no real I/O - couples tests tightly to the exact internal call sequence of the implementation. A harmless refactor (reordering two internal calls, inlining a helper) then breaks tests that should never have cared how the result was produced.

## Bad

```csharp
[Fact]
public void CalculateTotal_SumsLineItems()
{
    var lineItemMock = Substitute.For<ILineItem>(); // mocking a plain value/data holder
    lineItemMock.Price.Returns(10m);
    lineItemMock.Quantity.Returns(2);

    var calculator = new TotalCalculator();
    var total = calculator.Calculate([lineItemMock]);

    Assert.Equal(20m, total);
}
// A real OrderLine(10m, 2) object would have worked identically and been simpler
```

## Good

```csharp
[Fact]
public void CalculateTotal_SumsLineItems()
{
    var calculator = new TotalCalculator();
    var total = calculator.Calculate([new OrderLine(price: 10m, quantity: 2)]); // real object, no mock needed

    Assert.Equal(20m, total);
}

// Reserve mocks for GENUINE external boundaries
[Fact]
public async Task ProcessAsync_ChargesGateway()
{
    var gateway = Substitute.For<IPaymentGateway>(); // real external dependency - a legitimate mock target
    gateway.ChargeAsync(Arg.Any<decimal>()).Returns(true);

    var processor = new OrderProcessor(gateway);
    await processor.ProcessAsync(new Order { Total = 100m });

    await gateway.Received(1).ChargeAsync(100m);
}
```

## See Also

- [test-nsubstitute-moq](test-nsubstitute-moq.md) - The full rule with more detail on mocking libraries
- [test-mock-interfaces-not-concretes](test-mock-interfaces-not-concretes.md) - What's mockable in the first place
