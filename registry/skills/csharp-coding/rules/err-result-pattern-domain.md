# err-result-pattern-domain

> Model expected, recoverable failures as a `Result<T>`-style return value, not exceptions

## Why It Matters

Some failures are routine, expected parts of a workflow (validation errors, business rule violations, "already exists"). Forcing every caller into try/catch for these makes control flow harder to follow and is slower than a normal return. A `Result<T>` (or a community library like `OneOf`/`FluentResults`/`ErrorOr`) makes the failure an explicit, typed part of the method's signature.

## Bad

```csharp
public Order PlaceOrder(OrderRequest request)
{
    if (!request.IsValid)
    {
        throw new ValidationException("Invalid order request"); // expected, routine outcome
    }
    return _repository.Save(request.ToOrder());
}

// Every caller needs try/catch just for ordinary validation failures
try
{
    var order = PlaceOrder(request);
    return Ok(order);
}
catch (ValidationException ex)
{
    return BadRequest(ex.Message);
}
```

## Good

```csharp
public readonly struct Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }

    private Result(bool isSuccess, T? value, string? error) =>
        (IsSuccess, Value, Error) = (isSuccess, value, error);

    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}

public Result<Order> PlaceOrder(OrderRequest request)
{
    if (!request.IsValid)
    {
        return Result<Order>.Failure("Invalid order request.");
    }
    return Result<Order>.Success(_repository.Save(request.ToOrder()));
}

// Caller branches with ordinary control flow - no exceptions for the routine case
var result = PlaceOrder(request);
return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
```

## Using an Established Library

```csharp
// ErrorOr, FluentResults, and OneOf are mature, widely-used community packages
// that provide this pattern with richer error types, LINQ-style composition, etc.
using ErrorOr;

public ErrorOr<Order> PlaceOrder(OrderRequest request)
{
    if (!request.IsValid)
    {
        return Error.Validation(description: "Invalid order request.");
    }
    return _repository.Save(request.ToOrder());
}
```

## Where This Doesn't Fit

```text
Still throw exceptions for genuine invariant violations, programmer errors, and
infrastructure failures (a database connection dropping) - see err-exceptions-exceptional.
Result<T> is for expected, "this happens routinely" business outcomes.
```

## See Also

- [err-exceptions-exceptional](err-exceptions-exceptional.md) - Deciding what's actually exceptional
- [type-nullable-value-types](type-nullable-value-types.md) - The simpler `T?` alternative for "found or not"
- [api-with-expression-nondestructive](api-with-expression-nondestructive.md) - Records pair well with Result types
