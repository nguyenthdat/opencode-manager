# type-notnullwhen-attributes

> Annotate your own `TryX`/nullable-flow APIs with `[NotNullWhen]`, `[MaybeNullWhen]`, and related attributes

## Why It Matters

The compiler's nullable flow analysis understands the BCL's `TryGetValue`/`TryParse` patterns because they're annotated with attributes like `[NotNullWhen(true)]`. Without the same attributes on your own `TryX` methods, the compiler can't narrow the `out` parameter's nullability after a successful call, forcing callers into unnecessary null checks (or unnecessary null-forgiving operators).

## Bad

```csharp
public bool TryGetUser(int id, out User? user) // no flow attribute
{
    user = _repository.Find(id);
    return user is not null;
}

if (TryGetUser(id, out var user))
{
    Console.WriteLine(user.Name); // CS8602 warning - compiler doesn't know `user` is non-null here
}
```

## Good

```csharp
public bool TryGetUser(int id, [NotNullWhen(true)] out User? user)
{
    user = _repository.Find(id);
    return user is not null;
}

if (TryGetUser(id, out var user))
{
    Console.WriteLine(user.Name); // no warning - compiler knows `user` is non-null when true is returned
}
```

## The Full Attribute Family

```csharp
// [NotNullWhen(true)]  - out/ref parameter is non-null when the method returns true
// [MaybeNullWhen(false)] - parameter MAY be null when the method returns false (input side)
// [NotNullIfNotNull(nameof(x))] - return value is non-null whenever parameter x is non-null
// [DoesNotReturn] - method never returns normally (always throws) - narrows flow after the call
// [DoesNotReturnIf(true)] - method never returns when a bool parameter has the given value

public static class Guard
{
    [DoesNotReturn]
    public static void Fail(string message) => throw new InvalidOperationException(message);
}

public string GetRequiredName(User? user)
{
    if (user is null)
    {
        Guard.Fail("User is required");
    }
    return user.Name; // no warning - compiler knows Guard.Fail() never returns, so user is non-null here
}
```

## `[return: NotNullIfNotNull]`

```csharp
[return: NotNullIfNotNull(nameof(input))]
public string? Normalize(string? input) => input?.Trim().ToLowerInvariant();

string? maybeNull = Normalize(null);       // compiler knows this can be null
string definitelyNotNull = Normalize("Hi")!; // compiler knows this can't be null - given a non-null input, ! is provably safe (though still required syntactically)
```

## See Also

- [type-nullable-reference-types](type-nullable-reference-types.md) - The feature these attributes refine
- [err-argumentnull-throwifnull](err-argumentnull-throwifnull.md) - ThrowIfNull is itself annotated this way in the BCL
