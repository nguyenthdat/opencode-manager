# proj-central-package-management

> Use central package management (`Directory.Packages.props`) to pin NuGet package versions in one place

## Why It Matters

Without central package management, every `.csproj` specifies its own version for shared dependencies (`Newtonsoft.Json`, `Microsoft.Extensions.*`), and version drift between projects becomes a real source of runtime binding errors and inconsistent behavior. Central Package Management (CPM) moves all version numbers into one file; individual projects reference packages by name only.

## Bad

```xml
<!-- src/Api/Api.csproj -->
<ItemGroup>
  <PackageReference Include="Serilog" Version="3.1.1" />
</ItemGroup>

<!-- src/Worker/Worker.csproj -->
<ItemGroup>
  <PackageReference Include="Serilog" Version="3.0.0" /> <!-- drifted - different version! -->
</ItemGroup>
```

## Good

```xml
<!-- Directory.Packages.props (repository root) -->
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="Serilog" Version="3.1.1" />
    <PackageVersion Include="FluentAssertions" Version="6.12.0" />
    <PackageVersion Include="xunit" Version="2.9.0" />
  </ItemGroup>
</Project>
```

```xml
<!-- src/Api/Api.csproj - no version needed, resolved centrally -->
<ItemGroup>
  <PackageReference Include="Serilog" />
</ItemGroup>

<!-- src/Worker/Worker.csproj - guaranteed to match Api's Serilog version -->
<ItemGroup>
  <PackageReference Include="Serilog" />
</ItemGroup>
```

## Overriding a Version for One Project (When Genuinely Needed)

```xml
<!-- Rare, deliberate exception - document WHY this project needs a different version -->
<ItemGroup>
  <PackageReference Include="Serilog" VersionOverride="3.0.0" /> <!-- pinned due to a known regression in 3.1.1 -->
</ItemGroup>
```

## Auditing for Vulnerable Packages

```xml
<PropertyGroup>
  <NuGetAudit>true</NuGetAudit>
  <NuGetAuditMode>all</NuGetAuditMode> <!-- audits both direct and transitive packages -->
</PropertyGroup>
```

## See Also

- [proj-directory-build-props](proj-directory-build-props.md) - The settings-focused counterpart file
- [lint-nuget-audit](lint-nuget-audit.md) - Auditing centrally-managed packages for vulnerabilities
