# name-namespace-matches-folder

> Match namespace names to the project's folder/assembly structure

## Why It Matters

When a type's namespace mirrors its file's folder path (rooted at the project's default namespace), navigating the codebase and predicting "where is `MyApp.Services.Billing.InvoiceGenerator` defined" becomes trivial - it's at `Services/Billing/InvoiceGenerator.cs`. Divergence between namespace and folder structure is a constant, low-grade source of confusion as a codebase grows.

## Bad

```text
Project: MyApp.Api
File:    Services/Billing/InvoiceGenerator.cs
Namespace: MyApp.Api.Billing.Invoices.Generation  // doesn't match the folder path at all
```

## Good

```text
Project: MyApp.Api  (root namespace: MyApp.Api)
File:    Services/Billing/InvoiceGenerator.cs
Namespace: MyApp.Api.Services.Billing
```

```csharp
namespace MyApp.Api.Services.Billing;

public class InvoiceGenerator { /* ... */ }
```

## Let the SDK Enforce It Automatically

```xml
<!-- .csproj -->
<PropertyGroup>
  <RootNamespace>MyApp.Api</RootNamespace>
</PropertyGroup>
```

```text
With RootNamespace set, most IDEs auto-generate a matching namespace when you
create a new file in a subfolder, and Roslyn analyzer IDE0130 ("Namespace does
not match folder structure") flags files where it has drifted - enable it via
.editorconfig: dotnet_style_namespace_match_folder = true
```

## Exceptions

```text
- Shared/common utility folders sometimes intentionally use a flatter namespace
  (e.g. everything under MyApp.Common rather than MyApp.Common.Utilities.Strings)
  - document the deviation if your team adopts one.
- Generated code folders (obj/, generated sources) are exempt by convention.
```

## See Also

- [proj-namespace-folder-structure](proj-namespace-folder-structure.md) - The project-structure-category counterpart
- [proj-file-scoped-namespaces](proj-file-scoped-namespaces.md) - Reducing nesting for namespace declarations
