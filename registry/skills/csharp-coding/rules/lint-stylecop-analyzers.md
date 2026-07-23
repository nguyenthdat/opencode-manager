# lint-stylecop-analyzers

> Use StyleCop.Analyzers for consistent, enforced code layout and documentation style

## Why It Matters

`Microsoft.CodeAnalysis.NetAnalyzers` focuses on correctness/performance/design; StyleCop.Analyzers specifically targets layout, ordering, and documentation conventions (member ordering, spacing around braces, `using` directive placement, documentation completeness) - the kind of consistency that keeps every file in a codebase "shaped" the same way regardless of author.

## Bad

```csharp
namespace MySolution.Domain;
using System; // using directives after the namespace - inconsistent with the rest of the codebase

public class OrderProcessor
{
    public void Process(Order order) { }   // public method...
    private void Validate(Order order) { } // ...then private...
    public OrderProcessor() { }            // ...then a constructor, in no consistent order
}
```

## Good

```xml
<!-- .csproj -->
<ItemGroup>
  <PackageReference Include="StyleCop.Analyzers" PrivateAssets="all" />
</ItemGroup>
```

```csharp
using System;

namespace MySolution.Domain;

public class OrderProcessor
{
    public OrderProcessor() { } // constructors first (SA1201: elements must appear in the correct order)

    public void Process(Order order) { } // public members before private

    private void Validate(Order order) { }
}
```

## Common StyleCop Rules Worth Knowing

```text
SA1200 - using directives must be placed correctly
SA1201 - elements must appear in the correct order (constructors, properties, methods...)
SA1028 - code must not contain trailing whitespace
SA1633 - file must have a header (often disabled/customized per team)
SA1600 - elements must be documented
```

## Configuring via stylecop.json

```json
{
  "$schema": "https://raw.githubusercontent.com/DotNetAnalyzers/StyleCopAnalyzers/master/StyleCop.Analyzers/StyleCop.Analyzers/Settings/stylecop.schema.json",
  "settings": {
    "documentationRules": {
      "companyName": "MyCompany",
      "documentInterfaces": true
    }
  }
}
```

## Disabling Rules That Don't Fit Your Team's Conventions

```ini
# .editorconfig
dotnet_diagnostic.SA1633.severity = none  # file headers not required by this team
dotnet_diagnostic.SA1101.severity = none  # "this." prefix not required - see name-underscore-private-fields instead
```

## See Also

- [lint-roslyn-analyzers](lint-roslyn-analyzers.md) - Correctness/performance-focused analyzers
- [lint-editorconfig-enforce](lint-editorconfig-enforce.md) - Layout rules configured via .editorconfig
- [name-underscore-private-fields](name-underscore-private-fields.md) - A convention often enforced via StyleCop
