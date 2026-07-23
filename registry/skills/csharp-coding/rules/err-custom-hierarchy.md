# err-custom-hierarchy

> Design a custom exception hierarchy that reflects distinct, catchable domain failure modes

## Why It Matters

A flat pile of `throw new Exception("...")` forces callers to catch the base type (and everything else with it) or parse message strings. A deliberate hierarchy - one base type for the domain/library plus specific subtypes for distinct failure modes - lets callers catch precisely what they can handle and lets everything else propagate.

## Bad

```csharp
public class OrderService
{
    public void PlaceOrder(Order order)
    {
        if (!_inventory.HasStock(order))
        {
            throw new Exception("Out of stock"); // callers can't distinguish this from anything else
        }
        if (!_payment.Charge(order))
        {
            throw new Exception("Payment failed");
        }
    }
}
```

## Good

```csharp
public abstract class OrderException : Exception
{
    protected OrderException(string message, Exception? inner = null) : base(message, inner) { }
}

public sealed class OutOfStockException : OrderException
{
    public OutOfStockException(string sku) : base($"'{sku}' is out of stock.") => Sku = sku;
    public string Sku { get; }
}

public sealed class PaymentDeclinedException : OrderException
{
    public PaymentDeclinedException(string reason) : base($"Payment declined: {reason}.") { }
}

public class OrderService
{
    public void PlaceOrder(Order order)
    {
        if (!_inventory.HasStock(order))
        {
            throw new OutOfStockException(order.Sku);
        }
        if (!_payment.Charge(order))
        {
            throw new PaymentDeclinedException("card expired");
        }
    }
}

// Callers can be precise
try
{
    orderService.PlaceOrder(order);
}
catch (OutOfStockException ex)
{
    NotifyBackorder(ex.Sku);
}
catch (PaymentDeclinedException ex)
{
    PromptForNewPaymentMethod(ex.Message);
}
catch (OrderException ex)
{
    LogUnexpectedOrderFailure(ex); // catch-all for the domain, not for everything
}
```

## Guidance

```text
- Derive from Exception (or a well-known base like InvalidOperationException) - not ApplicationException
- Give the hierarchy a single, sealed-by-default abstract root per domain/library
- Only add a new subtype when callers genuinely need to branch on it differently
- Always provide the standard constructors: (), (string), (string, Exception)
```

## See Also

- [err-exceptions-exceptional](err-exceptions-exceptional.md) - When to throw at all
- [err-no-catch-exception](err-no-catch-exception.md) - Why catching the base type broadly is risky
- [err-wrap-with-innerexception](err-wrap-with-innerexception.md) - Preserving causal chains
