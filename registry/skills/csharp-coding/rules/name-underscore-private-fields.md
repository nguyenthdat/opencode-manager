# name-underscore-private-fields

> Prefix private (and private protected) instance fields with `_camelCase`

## Why It Matters

The leading underscore instantly distinguishes a field access from a local variable or parameter at every use site, without needing `this.` everywhere. It's the convention used throughout the .NET runtime, ASP.NET Core, and the official .NET Coding Conventions/StyleCop default rule set.

## Bad

```csharp
public class OrderProcessor
{
    private readonly IPaymentGateway gateway; // no leading underscore - looks like a local
    private int retryCount; // ambiguous with a parameter/local named retryCount

    public OrderProcessor(IPaymentGateway gateway) // shadows the field name
    {
        this.gateway = gateway; // forced to use `this.` to disambiguate
    }
}
```

## Good

```csharp
public class OrderProcessor
{
    private readonly IPaymentGateway _gateway;
    private int _retryCount;

    public OrderProcessor(IPaymentGateway gateway) => _gateway = gateway; // no ambiguity, no `this.` needed
}
```

## Static Fields

```csharp
public class Defaults
{
    // Convention varies by team for static fields - some use s_ or t_ prefixes
    // (seen in the .NET runtime source) to distinguish static/thread-static from instance.
    private static readonly HttpClient s_httpClient = new();
    [ThreadStatic] private static int t_requestCount;

    // A plain _camelCase static field is also widely accepted - pick one convention
    // per codebase and enforce it via .editorconfig (see lint-editorconfig-enforce).
    private static readonly HttpClient _httpClient = new();
}
```

## Public/Protected Fields Are PascalCase, Not Underscored

```csharp
public class Config
{
    public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30); // PascalCase - it's public
    private readonly TimeSpan _timeout; // _camelCase - it's private
}
```

## See Also

- [name-pascalcase-public](name-pascalcase-public.md) - The public-member counterpart
- [name-camelcase-locals](name-camelcase-locals.md) - Locals and parameters
- [immut-readonly-fields](immut-readonly-fields.md) - Related field-design guidance
