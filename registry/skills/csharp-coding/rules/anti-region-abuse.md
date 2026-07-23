# anti-region-abuse

> Don't use `#region` to hide poorly organized code instead of actually refactoring it

## Why It Matters

Wrapping a 500-line class in a handful of collapsed `#region` blocks makes it *look* organized in an IDE's collapsed outline view while doing nothing to address the actual problem - too many unrelated responsibilities crammed into one file. Regions hide the symptom; splitting the class addresses the cause.

## Bad

```csharp
public class OrderManager
{
    #region Validation
    public void ValidateOrder(Order order) { /* ... */ }
    #endregion

    #region Persistence
    public void SaveOrder(Order order) { /* ... */ }
    #endregion

    #region Notifications
    public void SendConfirmation(Order order) { /* ... */ }
    #endregion

    #region Reporting
    public byte[] GenerateInvoice(Order order) { /* ... */ return []; }
    #endregion
    // Collapsed, this LOOKS tidy - but it's still one 500-line class doing
    // four unrelated jobs, now with an extra layer of visual sugar over it.
}
```

## Good

```csharp
public class OrderValidator { public void Validate(Order order) { /* ... */ } }
public class OrderRepository { public Task SaveAsync(Order order) { /* ... */ return Task.CompletedTask; } }
public class OrderNotifier { public Task NotifyAsync(Order order) { /* ... */ return Task.CompletedTask; } }
public class InvoiceGenerator { public byte[] Generate(Order order) { /* ... */ return []; } }
// Each responsibility is now its own small, independently testable, independently
// navigable class - no regions needed, because there's nothing to hide.
```

## Regions Aren't Always Wrong, But Rarely Needed

```csharp
// A narrow, genuinely useful case: grouping generated/designer code that's
// truly never hand-edited (e.g. some WinForms Designer.cs files) - even here,
// most modern tooling and partial classes make explicit regions unnecessary.
```

## See Also

- [anti-god-class](anti-god-class.md) - The underlying problem regions often paper over
- [api-interface-segregation](api-interface-segregation.md) - Splitting responsibilities properly
