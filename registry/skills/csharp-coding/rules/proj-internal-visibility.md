# proj-internal-visibility

> Default to `internal` visibility for types/members; make something `public` only when it's a deliberate part of the API

## Why It Matters

`public` is a permanent commitment for a library - once external code depends on a public member, removing or changing it is a breaking change. Defaulting new types to `internal` (C#'s actual default for top-level types) and promoting to `public` only when there's a genuine external consumer keeps your API surface intentional and minimal.

## Bad

```csharp
public class OrderValidationHelper // implementation detail, but marked public "just in case"
{
    public bool CheckTotal(Order order) => order.Total > 0;
}

public class OrderProcessor(OrderValidationHelper helper) // now this internal helper is part of the public API
{
    public void Process(Order order)
    {
        if (helper.CheckTotal(order)) { /* ... */ }
    }
}
```

## Good

```csharp
internal class OrderValidationHelper // clearly an implementation detail
{
    public bool CheckTotal(Order order) => order.Total > 0;
}

public class OrderProcessor(OrderValidationHelper helper) // still fine - OrderProcessor is public,
{                                                          // but its internal collaborator isn't leaked
    public void Process(Order order)
    {
        if (helper.CheckTotal(order)) { /* ... */ }
    }
}
```

## Roslyn Analyzer Enforcement

```text
CA1515 ("Consider making public types internal") flags public types in
non-library projects (executables) that have no external consumer - enable it
to catch accidental over-exposure automatically.
```

## Public API Surface Tracking

```text
For libraries, tools like Microsoft.CodeAnalysis.PublicApiAnalyzers maintain
a checked-in PublicAPI.txt listing every public member - any addition or
removal must be explicitly reflected in that file, making API surface changes
a visible, reviewable part of every pull request.
```

## See Also

- [proj-internalsvisibleto-tests](proj-internalsvisibleto-tests.md) - Exposing internals to tests specifically, not the world
- [api-sealed-by-default](api-sealed-by-default.md) - A related "minimize the committed surface" principle
