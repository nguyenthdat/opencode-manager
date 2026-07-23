# test-nsubstitute-moq

> Use NSubstitute or Moq to isolate the code under test from its collaborators

## Why It Matters

Unit tests should exercise one unit of behavior in isolation. Mocking libraries generate fake implementations of your interfaces at test time, letting you control their return values and verify they were called correctly, without standing up real databases, HTTP servers, or other expensive/non-deterministic infrastructure.

## Basic Usage: NSubstitute

```csharp
public interface IPaymentGateway
{
    Task<bool> ChargeAsync(decimal amount);
}

[Fact]
public async Task ProcessAsync_ReturnsTrue_WhenGatewayApproves()
{
    var gateway = Substitute.For<IPaymentGateway>();
    gateway.ChargeAsync(Arg.Any<decimal>()).Returns(true);

    var processor = new OrderProcessor(gateway);
    var result = await processor.ProcessAsync(new Order { Total = 100m });

    Assert.True(result);
    await gateway.Received(1).ChargeAsync(100m);
}
```

## Basic Usage: Moq

```csharp
[Fact]
public async Task ProcessAsync_ReturnsTrue_WhenGatewayApproves()
{
    var gateway = new Mock<IPaymentGateway>();
    gateway.Setup(g => g.ChargeAsync(It.IsAny<decimal>())).ReturnsAsync(true);

    var processor = new OrderProcessor(gateway.Object);
    var result = await processor.ProcessAsync(new Order { Total = 100m });

    Assert.True(result);
    gateway.Verify(g => g.ChargeAsync(100m), Times.Once);
}
```

## Argument Matching and Throwing

```csharp
// NSubstitute
gateway.ChargeAsync(Arg.Is<decimal>(amount => amount > 1000))
    .Returns(_ => throw new PaymentDeclinedException("Amount too large"));

// Moq
gateway.Setup(g => g.ChargeAsync(It.Is<decimal>(a => a > 1000)))
    .ThrowsAsync(new PaymentDeclinedException("Amount too large"));
```

## Verifying Call Sequences

```csharp
// NSubstitute
Received.InOrder(() =>
{
    gateway.ValidateAsync(order);
    gateway.ChargeAsync(order.Total);
});

// Moq typically uses a MockSequence for this
var sequence = new MockSequence();
gateway.InSequence(sequence).Setup(g => g.ValidateAsync(order));
gateway.InSequence(sequence).Setup(g => g.ChargeAsync(order.Total));
```

## Don't Over-Mock

```text
Mock only genuine external boundaries (payment gateways, HTTP clients,
repositories) - not every collaborator. Over-mocking couples tests tightly
to implementation details and makes refactors break tests that shouldn't
have cared. See anti-over-mocking.
```

## See Also

- [test-mock-interfaces-not-concretes](test-mock-interfaces-not-concretes.md) - What's mockable in the first place
- [anti-over-mocking](anti-over-mocking.md) - Anti-pattern reference
