# doc-exception-tags

> Document exceptions a method can throw with `<exception>` tags

## Why It Matters

A method that can throw is making an implicit contract with its callers - which exceptions are possible, and under what conditions. Without `<exception>` tags, that contract only exists in the implementation (or worse, only in production incident postmortems); callers have no IntelliSense-visible way to know what to catch.

## Bad

```csharp
public decimal ApplyDiscount(decimal price, decimal percentage)
{
    if (percentage is < 0 or > 1)
    {
        throw new ArgumentOutOfRangeException(nameof(percentage), "Must be between 0 and 1.");
    }
    return price * (1 - percentage);
    // Caller has no documented way to know this can throw, or under what condition
}
```

## Good

```csharp
/// <summary>Applies a percentage discount to a price.</summary>
/// <param name="price">The original price.</param>
/// <param name="percentage">The discount percentage, between 0.0 and 1.0.</param>
/// <returns>The discounted price.</returns>
/// <exception cref="ArgumentOutOfRangeException">
/// <paramref name="percentage"/> is less than 0 or greater than 1.
/// </exception>
public decimal ApplyDiscount(decimal price, decimal percentage)
{
    if (percentage is < 0 or > 1)
    {
        throw new ArgumentOutOfRangeException(nameof(percentage), "Must be between 0 and 1.");
    }
    return price * (1 - percentage);
}
```

## Multiple Exception Types

```csharp
/// <exception cref="ArgumentNullException"><paramref name="path"/> is <see langword="null"/>.</exception>
/// <exception cref="FileNotFoundException">The file at <paramref name="path"/> does not exist.</exception>
/// <exception cref="UnauthorizedAccessException">The caller lacks permission to read the file.</exception>
public Config LoadConfig(string path)
{
    ArgumentNullException.ThrowIfNull(path);
    // ...
    return new Config();
}
```

## Don't Document Every Possible Exception - Only the Meaningful Ones

```text
Documenting EVERY theoretical exception (including OutOfMemoryException or
StackOverflowException-adjacent conditions) adds noise without value. Document
the exceptions callers can reasonably anticipate, check for, and recover from -
typically ArgumentException-family exceptions and domain-specific exception types.
```

## See Also

- [doc-param-returns-tags](doc-param-returns-tags.md) - Parameter/return documentation
- [err-custom-hierarchy](err-custom-hierarchy.md) - The exception types being documented
