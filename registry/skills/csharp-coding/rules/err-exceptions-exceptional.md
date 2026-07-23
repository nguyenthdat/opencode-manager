# err-exceptions-exceptional

> Reserve exceptions for exceptional, unexpected conditions - not routine control flow

## Why It Matters

Throwing and catching exceptions is orders of magnitude slower than a normal return path (stack unwinding, stack trace capture). Using exceptions for expected outcomes (a user not found, invalid input, end of a collection) also obscures the method's real contract - callers can't tell from the signature which "errors" are actually routine.

## Bad

```csharp
public User GetUser(int id)
{
    var user = _repository.Find(id);
    if (user is null)
    {
        throw new UserNotFoundException(id); // "not found" is an expected outcome, not exceptional
    }
    return user;
}

// Caller must use exceptions for ordinary branching
try
{
    var user = GetUser(id);
    Display(user);
}
catch (UserNotFoundException)
{
    ShowNotFound();
}
```

## Good

```csharp
public User? GetUser(int id) => _repository.Find(id); // null is a normal, expected result

var user = GetUser(id);
if (user is null)
{
    ShowNotFound();
    return;
}
Display(user);

// Or use TryGetX for the classic .NET pattern
public bool TryGetUser(int id, [NotNullWhen(true)] out User? user)
{
    user = _repository.Find(id);
    return user is not null;
}

if (TryGetUser(id, out var found))
{
    Display(found);
}
```

## When an Exception Is the Right Tool

```csharp
// Genuinely exceptional: violates a precondition/invariant the caller promised to uphold
public void Withdraw(decimal amount)
{
    if (amount < 0)
    {
        throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be non-negative.");
    }
    if (amount > Balance)
    {
        throw new InvalidOperationException("Insufficient funds."); // genuine invariant violation
    }
    Balance -= amount;
}
```

## See Also

- [err-result-pattern-domain](err-result-pattern-domain.md) - Modeling expected failures as values
- [anti-primitive-obsession](anti-primitive-obsession.md) - Related API design smell
- [type-nullable-value-types](type-nullable-value-types.md) - `T?` for optional results
