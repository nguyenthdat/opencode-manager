# api-static-factory-methods

> Use a named static factory method when construction needs validation, a descriptive name, or conditional logic

## Why It Matters

A constructor's name is always just the type name - it can't describe intent, and it either succeeds or throws (there's no room for `TryX`-style conditional creation). A static factory method can be named for what it does, can validate across multiple fields before producing a valid instance, and can return a `Result`/`bool` for expected failure without an exception.

## Bad

```csharp
public class EmailAddress
{
    public string Value { get; }

    public EmailAddress(string value)
    {
        // Constructor either throws or succeeds - no room for a non-throwing variant,
        // and "new EmailAddress(...)" doesn't communicate that validation happens.
        if (!value.Contains('@'))
        {
            throw new ArgumentException("Invalid email address", nameof(value));
        }
        Value = value;
    }
}
```

## Good

```csharp
public sealed class EmailAddress
{
    public string Value { get; }

    private EmailAddress(string value) => Value = value; // private - only factories construct this

    public static EmailAddress Parse(string value)
    {
        if (!TryParse(value, out var email))
        {
            throw new FormatException($"'{value}' is not a valid email address.");
        }
        return email;
    }

    public static bool TryParse(string value, [NotNullWhen(true)] out EmailAddress? email)
    {
        if (value.Contains('@') && value.Length <= 254)
        {
            email = new EmailAddress(value);
            return true;
        }
        email = null;
        return false;
    }
}

var email = EmailAddress.Parse("user@example.com");
if (EmailAddress.TryParse(input, out var parsed))
{
    Use(parsed);
}
```

## Naming Conventions for Factories

```csharp
// Create - general construction with defaults
public static Configuration CreateDefault() => new(/* ... */);

// From - conversion from another representation
public static Temperature FromCelsius(double celsius) => new(celsius * 9 / 5 + 32);

// Parse/TryParse - parsing from a string representation (the strongest convention, see api-parse-dont-validate)
public static Version Parse(string text) => /* ... */ new();
```

## See Also

- [api-required-members](api-required-members.md) - Enforcing presence, not cross-field validity
- [type-strongly-typed-ids](type-strongly-typed-ids.md) - A common use case for validated factory-constructed types
- [immut-value-object-record](immut-value-object-record.md) - Value objects often pair with factories
