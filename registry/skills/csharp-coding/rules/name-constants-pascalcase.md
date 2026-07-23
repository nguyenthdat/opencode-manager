# name-constants-pascalcase

> Use `PascalCase` for constants and static readonly fields - not `SCREAMING_SNAKE_CASE`

## Why It Matters

Unlike C, C++, or Java, the official .NET naming guidelines specify `PascalCase` for constants, matching how all other public members are named. `SCREAMING_SNAKE_CASE`, common in other languages, is inconsistent with .NET conventions and immediately signals code that wasn't written with .NET idioms in mind.

## Bad

```csharp
public class Limits
{
    public const int MAX_RETRIES = 3;             // wrong casing convention for C#
    public const string DEFAULT_REGION = "us-east-1";
    public static readonly TimeSpan REQUEST_TIMEOUT = TimeSpan.FromSeconds(30);
}
```

## Good

```csharp
public class Limits
{
    public const int MaxRetries = 3;
    public const string DefaultRegion = "us-east-1";
    public static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(30);
}
```

## const vs static readonly

```csharp
// const: value baked into the CALLER's compiled IL at compile time - only for
// values that can never need to change without recompiling all consumers
// (primitives, strings, enums).
public const int MaxRetries = 3;

// static readonly: evaluated once at runtime (type initialization) - use for
// anything that isn't a compile-time constant expression, or that you want
// to be able to change without forcing every consumer to recompile.
public static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(30);
public static readonly Guid SystemUserId = new("00000000-0000-0000-0000-000000000001");
```

## Local Constants Follow the Same Rule

```csharp
public void Process()
{
    const int MaxAttempts = 3; // still PascalCase, even as a local const
    for (var attempt = 0; attempt < MaxAttempts; attempt++) { /* ... */ }
}
```

## See Also

- [name-pascalcase-public](name-pascalcase-public.md) - General public naming conventions
- [anti-magic-strings-numbers](anti-magic-strings-numbers.md) - Naming constants instead of using literals inline
