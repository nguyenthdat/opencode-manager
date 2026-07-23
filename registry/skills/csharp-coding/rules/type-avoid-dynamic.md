# type-avoid-dynamic

> Avoid `dynamic`; prefer generics, interfaces, or `object` with pattern matching for compile-time safety

## Why It Matters

`dynamic` defers all type checking to runtime - typos in member names, wrong argument counts, and type mismatches all compile successfully and only fail when the code actually executes, often in production. It also defeats IntelliSense, refactoring tools, and static analysis entirely for anything touching the dynamic value.

## Bad

```csharp
public decimal GetTotal(dynamic order)
{
    return order.Total; // typo'd as order.Totl compiles fine, throws RuntimeBinderException at runtime
}

dynamic config = JsonSerializer.Deserialize<dynamic>(json)!;
Console.WriteLine(config.ApiKey); // no compile-time check this property even exists
```

## Good

```csharp
public decimal GetTotal(Order order) => order.Total; // compiler catches typos immediately

public class Config
{
    public string ApiKey { get; init; } = "";
}

var config = JsonSerializer.Deserialize<Config>(json)!;
Console.WriteLine(config.ApiKey); // compile-time checked, refactor-safe
```

## Legitimate Uses of `dynamic`

```csharp
// 1. COM interop, where member signatures are only known at runtime
dynamic excelApp = Activator.CreateInstance(Type.GetTypeFromProgID("Excel.Application")!)!;
excelApp.Visible = true;

// 2. Interop with genuinely dynamic languages/DLR scenarios (IronPython, etc.)

// 3. Extremely generic serialization/reflection-based frameworks where the
//    shape is truly unknown at compile time - even here, prefer JsonElement/
//    JsonDocument or reflection with explicit checks over dynamic where possible.
JsonElement element = JsonDocument.Parse(json).RootElement;
if (element.TryGetProperty("apiKey", out var apiKeyElement))
{
    var apiKey = apiKeyElement.GetString();
}
```

## dynamic vs object

```csharp
// object: still statically typed as "unknown, requires a cast" - the compiler
// forces you to cast/pattern-match before calling members, catching mistakes early.
object value = GetValue();
if (value is int number) { Use(number); }

// dynamic: bypasses static checking entirely - avoid unless truly necessary.
```

## See Also

- [type-avoid-object-typed](type-avoid-object-typed.md) - The safer middle ground
- [type-pattern-matching-is](type-pattern-matching-is.md) - Safely narrowing object-typed values
