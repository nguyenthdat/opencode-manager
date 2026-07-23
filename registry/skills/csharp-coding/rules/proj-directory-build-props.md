# proj-directory-build-props

> Centralize shared MSBuild settings in `Directory.Build.props` instead of duplicating them across every `.csproj`

## Why It Matters

Repeating the same `<Nullable>`, `<LangVersion>`, `<TreatWarningsAsErrors>`, and analyzer settings in every project file means every new project can forget one, and every policy change (e.g. "enable nullable everywhere") requires editing N files instead of one. `Directory.Build.props`, placed at (or above) the solution root, is automatically picked up by every project beneath it.

## Bad

```xml
<!-- src/Api/Api.csproj -->
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
  <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  <AnalysisLevel>latest</AnalysisLevel>
</PropertyGroup>

<!-- src/Domain/Domain.csproj -->
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
  <!-- TreatWarningsAsErrors forgotten here - drifted out of sync -->
</PropertyGroup>
```

## Good

```xml
<!-- Directory.Build.props (repository root) -->
<Project>
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <AnalysisLevel>latest</AnalysisLevel>
    <LangVersion>latest</LangVersion>
  </PropertyGroup>
</Project>
```

```xml
<!-- src/Api/Api.csproj - inherits everything above automatically -->
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <!-- Only project-SPECIFIC settings belong here -->
    <OutputType>Exe</OutputType>
  </PropertyGroup>
</Project>
```

## Per-Folder Overrides

```xml
<!-- tests/Directory.Build.props - additional settings scoped to just the tests/ subtree -->
<Project>
  <Import Project="$([MSBuild]::GetPathOfFileAbove('Directory.Build.props', '$(MSBuildThisFileDirectory)../'))" />
  <PropertyGroup>
    <IsPackable>false</IsPackable>
    <NoWarn>$(NoWarn);CS1591</NoWarn> <!-- test projects don't need public API docs -->
  </PropertyGroup>
</Project>
```

## See Also

- [proj-central-package-management](proj-central-package-management.md) - The package-version counterpart
- [lint-treat-warnings-as-errors](lint-treat-warnings-as-errors.md) - A setting typically centralized here
- [proj-nullable-enable-solution-wide](proj-nullable-enable-solution-wide.md) - Another setting centralized here
