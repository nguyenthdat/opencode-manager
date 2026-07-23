# proj-nullable-enable-solution-wide

> Enable nullable reference types solution-wide via `Directory.Build.props`, not project-by-project

## Why It Matters

Nullable reference type checking is only as valuable as its coverage - a solution where some projects have it enabled and others don't creates blind spots exactly at the boundaries between them (a nullable-disabled project can freely pass nulls into a nullable-enabled one with no warning). Enabling it centrally guarantees every new project inherits the setting automatically.

## Bad

```xml
<!-- src/Api/Api.csproj -->
<PropertyGroup>
  <Nullable>enable</Nullable>
</PropertyGroup>

<!-- src/Infrastructure/Infrastructure.csproj - forgotten, nullable checking silently absent here -->
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
</PropertyGroup>
```

## Good

```xml
<!-- Directory.Build.props -->
<Project>
  <PropertyGroup>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
```

```text
Every project under the solution root now has nullable reference types
enabled automatically, including any NEW project added later - no
per-project setup step to forget.
```

## Migrating an Existing, Large Codebase Incrementally

```xml
<!-- Start warnings-only (not errors), then promote per-project as each is cleaned up -->
<Project>
  <PropertyGroup>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
```

```xml
<!-- src/LegacyModule/LegacyModule.csproj - opt OUT temporarily, tracked as tech debt -->
<PropertyGroup>
  <Nullable>disable</Nullable> <!-- TODO: remove once nullable warnings are triaged (TICKET-1234) -->
</PropertyGroup>
```

## Promote to Errors Once Clean

```xml
<PropertyGroup>
  <Nullable>enable</Nullable>
  <WarningsAsErrors>$(WarningsAsErrors);CS8600;CS8602;CS8603;CS8618</WarningsAsErrors>
</PropertyGroup>
```

## See Also

- [type-nullable-reference-types](type-nullable-reference-types.md) - The feature itself, in depth
- [proj-directory-build-props](proj-directory-build-props.md) - Centralizing this and other settings
- [lint-nullable-warnings-errors](lint-nullable-warnings-errors.md) - Promoting these warnings to errors
