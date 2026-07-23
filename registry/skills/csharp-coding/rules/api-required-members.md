# api-required-members

> Use `required` members instead of throwing constructors to enforce mandatory data

## Why It Matters

Before `required` (C# 11+), enforcing "this property must be set" meant either a constructor with a long parameter list or a runtime null-check. `required` lets the compiler enforce at every construction site that the member is set, while still allowing the convenience of object-initializer syntax and property names at the call site.

## Bad

```csharp
public class CreateUserRequest
{
    public string Email { get; set; } = "";
    public string DisplayName { get; set; } = "";
}

// Nothing stops this from compiling with missing/wrong-typed data:
var request = new CreateUserRequest(); // Email and DisplayName silently default to ""
```

## Good

```csharp
public class CreateUserRequest
{
    public required string Email { get; init; }
    public required string DisplayName { get; init; }
}

// var bad = new CreateUserRequest(); // CS9035: compile error - Email/DisplayName not set
var request = new CreateUserRequest
{
    Email = "user@example.com",
    DisplayName = "Ada Lovelace"
};
```

## Combining With a Constructor

```csharp
public class CreateUserRequest
{
    public required string Email { get; init; }
    public required string DisplayName { get; init; }

    [SetsRequiredMembers]
    public CreateUserRequest(string email, string displayName)
    {
        Email = email;
        DisplayName = displayName;
    }
}

// Both construction styles work and are equally enforced:
var a = new CreateUserRequest("user@example.com", "Ada Lovelace");
var b = new CreateUserRequest { Email = "user@example.com", DisplayName = "Ada Lovelace" };
```

## Required Members and Records

```csharp
public record CreateUserRequest
{
    public required string Email { get; init; }
    public required string DisplayName { get; init; }
}

// Positional records already enforce all parameters via the constructor,
// so `required` is mainly useful on records with property-initializer syntax.
```

## See Also

- [api-init-only-properties](api-init-only-properties.md) - The `init` accessor these build on
- [err-argumentnull-throwifnull](err-argumentnull-throwifnull.md) - Validating required VALUES, not just presence
- [api-static-factory-methods](api-static-factory-methods.md) - Alternative for cross-field validation
