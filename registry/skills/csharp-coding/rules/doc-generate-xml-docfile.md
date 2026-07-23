# doc-generate-xml-docfile

> Enable `GenerateDocumentationFile` and treat missing documentation on public APIs as a warning (or error)

## Why It Matters

Without `GenerateDocumentationFile`, the compiler doesn't even check that your XML doc comments are well-formed or complete - typos in `<param name>`, mismatched `cref` references, and entirely undocumented public members go unnoticed. Enabling it (and promoting `CS1591`, "missing XML comment", from silent to a warning) turns documentation into something the build enforces, not something that quietly rots.

## Bad

```xml
<!-- .csproj: no documentation file generated at all -->
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
</PropertyGroup>
```

```csharp
// Compiles cleanly even with a typo'd cref or a missing summary - nothing catches it
/// <summary>Processes an order.</summary>
/// <param name="ordr">The order.</param> // typo: doesn't match the actual parameter name "order"
public void Process(Order order) { }
```

## Good

```xml
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <!-- CS1591: "missing XML comment for publicly visible type or member" -
       leave this warning ENABLED (don't suppress it) once the codebase is fully documented -->
</PropertyGroup>
```

```csharp
/// <param name="ordr">The order.</param> // now produces CS1572: "parameter has no matching param tag"
public void Process(Order order) { }
```

## Migrating an Existing, Partially-Documented Codebase

```xml
<!-- Suppress CS1591 temporarily while documentation is being added incrementally,
     then remove the suppression once public API coverage is complete. -->
<PropertyGroup>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <NoWarn>$(NoWarn);CS1591</NoWarn>
</PropertyGroup>
```

## Packing the Doc File Into a NuGet Package

```xml
<!-- The generated XML file ships alongside the DLL in the NuGet package,
     giving IntelliSense to consumers who reference your package. -->
<PropertyGroup>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <IncludeSymbols>true</IncludeSymbols>
</PropertyGroup>
```

## See Also

- [doc-xml-summary-public](doc-xml-summary-public.md) - What actually gets documented
- [lint-treat-warnings-as-errors](lint-treat-warnings-as-errors.md) - Promoting documentation warnings to build-breaking errors
