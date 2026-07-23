# lint-roslyn-analyzers

> Enable `Microsoft.CodeAnalysis.NetAnalyzers` with a recommended rule set to catch correctness and design issues at build time

## Why It Matters

The .NET SDK ships a large, official set of Roslyn analyzers (`CAxxxx` diagnostics) covering correctness (disposal, threading), security (SQL injection patterns, insecure deserialization), performance (unnecessary allocations, `StringBuilder` usage), and API design - all runnable at build time with zero extra dependencies, but disabled or minimal by default unless `AnalysisLevel` is configured.

## Bad

```xml
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
  <!-- Default analysis level - misses many valuable CA diagnostics -->
</PropertyGroup>
```

## Good

```xml
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
  <AnalysisLevel>latest</AnalysisLevel>
  <AnalysisMode>Recommended</AnalysisMode> <!-- or "All" for maximum strictness -->
  <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
</PropertyGroup>
```

## Examples of What This Catches

```csharp
public void Bad()
{
    var stream = new FileStream("data.bin", FileMode.Open); // CA2000: dispose objects before losing scope
}

public string Concat(List<string> parts)
{
    var result = "";
    foreach (var p in parts) result += p; // CA1834/CA1845: prefer StringBuilder / span-based concat
    return result;
}

public async void BadAsync() { } // CA1849/related async-correctness diagnostics flag this shape
```

## Selectively Enabling Individual Rules Not On by Default

```xml
<ItemGroup>
  <PackageReference Include="Microsoft.CodeAnalysis.NetAnalyzers" Version="9.0.0" PrivateAssets="all" />
</ItemGroup>
```

```ini
# .editorconfig
dotnet_diagnostic.CA2007.severity = warning  # ConfigureAwait(false) missing in library code
dotnet_diagnostic.CA1848.severity = warning  # use LoggerMessage delegates for high-performance logging
```

## Category-Based Severity Configuration

```ini
dotnet_analyzer_diagnostic.category-Security.severity = error
dotnet_analyzer_diagnostic.category-Reliability.severity = warning
dotnet_analyzer_diagnostic.category-Performance.severity = suggestion
```

## See Also

- [lint-code-analysis-enforce-latest](lint-code-analysis-enforce-latest.md) - Keeping AnalysisLevel current
- [lint-stylecop-analyzers](lint-stylecop-analyzers.md) - Complementary style-focused analyzers
- [lint-banned-api-analyzer](lint-banned-api-analyzer.md) - A targeted, custom analyzer addition
