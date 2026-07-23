# proj-solution-folder-layout

> Organize solution folders by architectural layer/purpose (`src`, `tests`, `tools`) rather than an ad-hoc flat structure

## Why It Matters

A consistent, predictable top-level layout means any developer (or new hire) can immediately locate production code, tests, build tooling, and documentation without hunting. As a solution grows past a handful of projects, an ad-hoc or historically-accreted structure becomes genuinely hard to navigate.

## Bad

```text
MySolution/
  MySolution.sln
  Api/
  ApiTests/
  Some.Old.Library/
  utils.ps1
  Domain2/
  helpers/
  DomainTests_new/
```

## Good

```text
MySolution/
  MySolution.sln
  Directory.Build.props
  Directory.Packages.props
  src/
    MySolution.Api/
    MySolution.Domain/
    MySolution.Infrastructure/
  tests/
    MySolution.Api.Tests/
    MySolution.Domain.Tests/
    MySolution.IntegrationTests/
  tools/
    MySolution.MigrationRunner/
  docs/
    architecture.md
```

## Matching Solution Explorer Structure to Disk Structure

```xml
<!-- MySolution.sln uses solution folders that mirror the physical src/tests split,
     so Visual Studio/Rider's Solution Explorer matches what's on disk. -->
```

## Grouping by Layer, Not by Technical Type

```text
Prefer grouping by BOUNDED CONTEXT or LAYER (Api, Domain, Infrastructure) over
grouping purely by technical artifact type (Controllers/, Services/, Models/
folders spanning unrelated features) - see proj-mod-by-feature-equivalent
guidance from other ecosystems; for C#, this usually means one project per
architectural layer, with feature-based folders WITHIN each project.
```

## See Also

- [proj-separate-test-projects](proj-separate-test-projects.md) - The tests/ split in more detail
- [proj-namespace-folder-structure](proj-namespace-folder-structure.md) - Matching namespaces to this layout
