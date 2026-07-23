# doc-inheritdoc

> Use `<inheritdoc/>` to avoid duplicating documentation on interface implementations and overrides

## Why It Matters

Copy-pasting the interface's documentation onto every implementing class (and keeping every copy in sync as the contract evolves) is exactly the kind of duplication `<inheritdoc/>` eliminates - it pulls the documentation from the base member automatically, staying correct even as the interface's docs change.

## Bad

```csharp
public interface IPaymentGateway
{
    /// <summary>Charges the given amount to the configured payment method.</summary>
    /// <param name="amount">The amount to charge, in the account's base currency.</param>
    /// <returns><see langword="true"/> if the charge succeeded.</returns>
    Task<bool> ChargeAsync(decimal amount);
}

public class StripeGateway : IPaymentGateway
{
    /// <summary>Charges the given amount to the configured payment method.</summary>
    /// <param name="amount">The amount to charge, in the account's base currency.</param>
    /// <returns><see langword="true"/> if the charge succeeded.</returns>
    // Exact copy-paste - will silently drift out of sync if the interface doc changes
    public Task<bool> ChargeAsync(decimal amount) => Task.FromResult(true);
}
```

## Good

```csharp
public interface IPaymentGateway
{
    /// <summary>Charges the given amount to the configured payment method.</summary>
    /// <param name="amount">The amount to charge, in the account's base currency.</param>
    /// <returns><see langword="true"/> if the charge succeeded.</returns>
    Task<bool> ChargeAsync(decimal amount);
}

public class StripeGateway : IPaymentGateway
{
    /// <inheritdoc/>
    public Task<bool> ChargeAsync(decimal amount) => Task.FromResult(true);
}
```

## Adding Implementation-Specific Notes on Top

```csharp
public class StripeGateway : IPaymentGateway
{
    /// <inheritdoc/>
    /// <remarks>Stripe-specific: retries transient network failures up to 3 times.</remarks>
    public Task<bool> ChargeAsync(decimal amount) => Task.FromResult(true);
}
```

## Referencing a Specific Member Explicitly

```csharp
public class StripeGateway : IPaymentGateway, IRefundable
{
    /// <inheritdoc cref="IPaymentGateway.ChargeAsync(decimal)"/>
    public Task<bool> ChargeAsync(decimal amount) => Task.FromResult(true);
}
```

## See Also

- [doc-xml-summary-public](doc-xml-summary-public.md) - The documentation being inherited
- [api-interface-segregation](api-interface-segregation.md) - Interface design this pairs with
