# anti-god-class

> Don't build "God classes" that accumulate unrelated responsibilities over time

## Why It Matters

A class that grows to handle validation, persistence, notification, reporting, and business logic all at once becomes impossible to reason about, impossible to unit test in isolation, and a magnet for merge conflicts (everyone touches it for every feature). Splitting responsibilities keeps each piece small, focused, and independently testable.

## Bad

```csharp
public class OrderManager
{
    public void ValidateOrder(Order order) { /* ... */ }
    public void SaveOrder(Order order) { /* ... */ }
    public void SendConfirmationEmail(Order order) { /* ... */ }
    public void GenerateInvoicePdf(Order order) { /* ... */ }
    public void UpdateInventory(Order order) { /* ... */ }
    public void LogAuditTrail(Order order) { /* ... */ }
    public void CalculateShippingCost(Order order) { /* ... */ }
    public void ApplyLoyaltyPoints(Order order) { /* ... */ }
    // ... 20 more unrelated methods, 2000+ lines, touched by every feature team
}
```

## Good

```csharp
public class OrderValidator { public void Validate(Order order) { /* ... */ } }
public class OrderRepository { public Task SaveAsync(Order order) { /* ... */ return Task.CompletedTask; } }
public class OrderNotifier { public Task NotifyAsync(Order order) { /* ... */ return Task.CompletedTask; } }
public class InvoiceGenerator { public byte[] GeneratePdf(Order order) { /* ... */ return []; } }
public class InventoryUpdater { public Task ApplyAsync(Order order) { /* ... */ return Task.CompletedTask; } }

public class OrderProcessor(
    OrderValidator validator,
    OrderRepository repository,
    OrderNotifier notifier)
{
    public async Task ProcessAsync(Order order)
    {
        validator.Validate(order);
        await repository.SaveAsync(order);
        await notifier.NotifyAsync(order);
    }
}
```

## See Also

- [api-interface-segregation](api-interface-segregation.md) - The full rule for interface size, related in spirit
- [api-sealed-by-default](api-sealed-by-default.md) - Keeping class responsibilities intentional
