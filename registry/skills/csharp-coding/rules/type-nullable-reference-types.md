# type-nullable-reference-types

> Enable nullable reference types (`<Nullable>enable</Nullable>`) project-wide and treat null-safety warnings seriously

## Why It Matters

Before nullable reference types (C# 8+), every reference type was implicitly nullable with no compiler help - `NullReferenceException` was ubiquitous and undetectable statically. With NRT enabled, the compiler tracks nullability through your code and flags dereferences of possibly-null values, method calls that don't handle null returns, and fields that are never initialized - turning a runtime crash class into a compile-time warning.

## Bad

```xml
<!-- .csproj: nullable reference types not enabled - no null-safety analysis at all -->
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
</PropertyGroup>
```

```csharp
public class UserService
{
    public User FindUser(int id) => _repository.Find(id); // might actually return null - no warning

    public void Greet(int id)
    {
        var user = FindUser(id);
        Console.WriteLine(user.Name); // NullReferenceException risk, invisible to the compiler
    }
}
```

## Good

```xml
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
  <Nullable>enable</Nullable>
</PropertyGroup>
```

```csharp
public class UserService
{
    public User? FindUser(int id) => _repository.Find(id); // ? makes "might be null" explicit

    public void Greet(int id)
    {
        var user = FindUser(id);
        Console.WriteLine(user.Name); // CS8602: compiler warning - possible null dereference
    }

    public void GreetSafely(int id)
    {
        var user = FindUser(id);
        if (user is not null)
        {
            Console.WriteLine(user.Name); // narrowed to non-null - no warning
        }
    }
}
```

## Migrating an Existing Project

```xml
<!-- Enable incrementally per-project, or per-file with #nullable directives,
     when adopting NRT on a large existing codebase -->
<PropertyGroup>
  <Nullable>enable</Nullable>
  <WarningsAsErrors>nullable</WarningsAsErrors> <!-- promote once the codebase is clean -->
</PropertyGroup>
```

```csharp
#nullable enable
// file-scoped opt-in, useful during incremental migration
```

## See Also

- [type-null-forgiving-sparingly](type-null-forgiving-sparingly.md) - The escape hatch, used carefully
- [type-notnullwhen-attributes](type-notnullwhen-attributes.md) - Annotating your own nullable-flow APIs
- [lint-nullable-warnings-errors](lint-nullable-warnings-errors.md) - Enforcing this in CI
