# lint-nuget-audit

> Enable `NuGetAudit` to detect known-vulnerable packages during restore/build

## Why It Matters

A dependency with a disclosed CVE can sit in a project indefinitely unnoticed unless something actively checks for it. `NuGetAudit` (built into the SDK since .NET 8) checks restored packages against the NuGet vulnerability database automatically, surfacing known vulnerabilities as build warnings (or errors) without needing a separate third-party tool.

## Bad

```xml
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
  <!-- NuGetAudit is enabled by default in recent SDKs, but explicitly disabling
       or ignoring it means vulnerable transitive dependencies go unnoticed. -->
  <NuGetAudit>false</NuGetAudit>
</PropertyGroup>
```

## Good

```xml
<PropertyGroup>
  <NuGetAudit>true</NuGetAudit>
  <NuGetAuditMode>all</NuGetAuditMode>       <!-- audit transitive packages too, not just direct references -->
  <NuGetAuditLevel>moderate</NuGetAuditLevel> <!-- fail on moderate severity and above -->
</PropertyGroup>
```

## Sample Output

```text
warning NU1902: Package 'Newtonsoft.Json' 12.0.1 has a known moderate severity
vulnerability, https://github.com/advisories/GHSA-5crp-9r3c-p9vr
```

## Promoting to a Build-Breaking Error in CI

```xml
<PropertyGroup Condition="'$(ContinuousIntegrationBuild)' == 'true'">
  <WarningsAsErrors>$(WarningsAsErrors);NU1902;NU1903</WarningsAsErrors>
</PropertyGroup>
```

## Complementary Tooling

```text
NuGetAudit checks packages at restore/build time using NuGet's own advisory
database. For broader software composition analysis (SBOM generation, license
compliance, deeper vulnerability databases), pair it with GitHub's Dependabot,
`dotnet list package --vulnerable`, or a dedicated SCA tool in CI.
```

```bash
dotnet list package --vulnerable --include-transitive
```

## See Also

- [proj-central-package-management](proj-central-package-management.md) - Where package versions are pinned
- [lint-treat-warnings-as-errors](lint-treat-warnings-as-errors.md) - Making vulnerability warnings build-breaking
