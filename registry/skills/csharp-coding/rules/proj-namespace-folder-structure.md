# proj-namespace-folder-structure

> Structure folders to mirror the project's namespace hierarchy consistently across the whole solution

## Why It Matters

This is the project-structure-wide policy behind the naming-convention rule for individual files: a consistent folder-to-namespace mapping applied across every project in the solution means the entire codebase is navigable the same way, not just within one project.

## Bad

```text
MySolution.Api/
  Program.cs
  Handlers/
    OrderHandler.cs        -> namespace MySolution.Api.Endpoints.Orders (doesn't match folder "Handlers")
  Features/
    Billing/
      InvoiceService.cs    -> namespace MySolution.Api.Services (doesn't match folder "Features.Billing")
```

## Good

```text
MySolution.Api/            (RootNamespace: MySolution.Api)
  Program.cs
  Endpoints/
    Orders/
      OrderHandler.cs       -> namespace MySolution.Api.Endpoints.Orders
  Features/
    Billing/
      InvoiceService.cs     -> namespace MySolution.Api.Features.Billing
```

## Enforcing It Solution-Wide

```xml
<!-- Directory.Build.props -->
<Project>
  <PropertyGroup>
    <!-- IDE0130 fires whenever a file's namespace doesn't match its folder path -->
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  </PropertyGroup>
</Project>
```

```ini
# .editorconfig
dotnet_style_namespace_match_folder = true:warning
```

## Special Folders (Fine to Diverge Slightly, By Convention)

```text
Some folders don't map 1:1 by design and that's an accepted, documented
exception across the team: obj/, bin/, wwwroot/ (static assets), Migrations/
(EF Core migrations often share a flat namespace regardless of subfolder).
```

## See Also

- [name-namespace-matches-folder](name-namespace-matches-folder.md) - The per-file naming convention this generalizes
- [proj-file-scoped-namespaces](proj-file-scoped-namespaces.md) - Reducing nesting once the namespace is set
