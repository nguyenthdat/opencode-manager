# name-interface-i-prefix

> Prefix interface names with `I`

## Why It Matters

The `I` prefix is one of the most universally followed .NET naming conventions - it instantly tells a reader (and IntelliSense) "this is a contract, not a concrete type" without needing to check the declaration. Every BCL interface (`IDisposable`, `IEnumerable<T>`, `IComparable<T>`) follows it, and deviating makes third-party/unfamiliar code harder to scan.

## Bad

```csharp
public interface PaymentGateway // missing the I prefix
{
    Task<bool> ChargeAsync(decimal amount);
}

public class StripeGateway : PaymentGateway { /* ... */ } // is this a class or an interface? unclear at a glance
```

## Good

```csharp
public interface IPaymentGateway
{
    Task<bool> ChargeAsync(decimal amount);
}

public class StripeGateway : IPaymentGateway { /* ... */ }
```

## Naming the Implementation

```csharp
// A common pattern: name the concrete implementation after the interface name
// without the "I", optionally with a descriptive prefix for multiple implementations.
public interface IEmailSender { Task SendAsync(Email email); }

public class SmtpEmailSender : IEmailSender { /* ... */ }
public class SendGridEmailSender : IEmailSender { /* ... */ }
```

## Generic Interfaces Follow the Same Rule

```csharp
public interface IRepository<T> where T : class
{
    T? GetById(int id);
}
```

## See Also

- [name-pascalcase-public](name-pascalcase-public.md) - General public naming conventions
- [api-interface-segregation](api-interface-segregation.md) - Interface design, not just naming
