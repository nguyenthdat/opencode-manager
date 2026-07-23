# lint-treat-warnings-as-errors

> Enable `TreatWarningsAsErrors` in CI builds so warnings can't silently accumulate

## Why It Matters

Warnings that don't fail the build get ignored in practice - they scroll past in CI logs and pile up until nobody reads them anymore, hiding the genuinely important ones among hundreds of stale, low-value warnings. Promoting warnings to build-breaking errors forces every warning to be fixed or explicitly, visibly suppressed the moment it's introduced.

## Bad

```xml
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
  <!-- No TreatWarningsAsErrors - the build "succeeds" with 200 accumulated warnings -->
</PropertyGroup>
```

## Good

```xml
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
  <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
</PropertyGroup>
```

## Enabling It Only in CI (Gentler Local Dev Loop)

```xml
<!-- Directory.Build.props -->
<Project>
  <PropertyGroup Condition="'$(ContinuousIntegrationBuild)' == 'true'">
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
</Project>
```

```bash
dotnet build -p:ContinuousIntegrationBuild=true
```

## Selectively Excluding Specific Warning Codes

```xml
<PropertyGroup>
  <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  <WarningsNotAsErrors>CS1591</WarningsNotAsErrors> <!-- e.g. missing XML docs, tracked separately -->
</PropertyGroup>
```

## Migrating a Codebase With Existing Warnings

```text
Introduce this incrementally: first fix or explicitly suppress every current
warning (with justification - see lint-suppress-with-justification), THEN
flip TreatWarningsAsErrors on, so it locks in a clean baseline rather than
immediately breaking every build.
```

## See Also

- [lint-nullable-warnings-errors](lint-nullable-warnings-errors.md) - The nullable-specific application of this rule
- [lint-suppress-with-justification](lint-suppress-with-justification.md) - Handling warnings you genuinely can't fix yet
