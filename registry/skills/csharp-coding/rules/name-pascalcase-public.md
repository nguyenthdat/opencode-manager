# name-pascalcase-public

> Use `PascalCase` for types, methods, properties, and all public members

## Why It Matters

Microsoft's C# Coding Conventions and .NET naming guidelines specify `PascalCase` for all publicly visible identifiers (classes, structs, interfaces, enums, methods, properties, events, public fields, namespaces). Consistency here is what makes .NET APIs immediately recognizable and IntelliSense-navigable across the entire ecosystem - deviating from it makes code feel foreign to every other .NET codebase.

## Bad

```csharp
public class orderProcessor // should be PascalCase
{
    public void process_order(Order order) // should be PascalCase, not snake_case
    {
        var total_amount = order.total; // OK for a local (see name-camelcase-locals), but `total` on Order should be PascalCase
    }

    public bool isValid { get; set; } // property should be PascalCase: IsValid
}
```

## Good

```csharp
public class OrderProcessor
{
    public decimal Total { get; init; }

    public void ProcessOrder(Order order)
    {
        var totalAmount = order.Total; // camelCase local, PascalCase member - see name-camelcase-locals
    }

    public bool IsValid { get; set; }
}
```

## What Gets PascalCase

```text
Classes, structs, records, interfaces (with I- prefix), enums, enum members,
delegates, events, methods, properties, public/protected fields, namespaces,
constants (see name-constants-pascalcase).
```

## What Does NOT

```text
Local variables and parameters -> camelCase (see name-camelcase-locals)
Private/internal fields -> _camelCase (see name-underscore-private-fields)
```

## See Also

- [name-camelcase-locals](name-camelcase-locals.md) - Locals and parameters
- [name-underscore-private-fields](name-underscore-private-fields.md) - Private field convention
- [name-interface-i-prefix](name-interface-i-prefix.md) - Interface-specific naming
