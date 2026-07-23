# lint-nullable-warnings-errors

> Promote nullable reference type warnings to errors as the codebase's nullable coverage matures

## Why It Matters

Nullable warnings (CS8600-series) are exactly the class of warning most likely to represent a real `NullReferenceException` waiting to happen - allowing them to remain "just warnings" indefinitely means they get ignored like any other warning noise. Promoting them to errors, once the codebase is clean, ensures every future nullable violation blocks the build instead of quietly shipping.

## Bad

```xml
<PropertyGroup>
  <Nullable>enable</Nullable>
  <!-- Nullable warnings pile up over time, ignored like any other warning -->
</PropertyGroup>
```

## Good

```xml
<PropertyGroup>
  <Nullable>enable</Nullable>
  <WarningsAsErrors>$(WarningsAsErrors);CS8600;CS8602;CS8603;CS8618;CS8625</WarningsAsErrors>
</PropertyGroup>
```

## Or, Once Fully Migrated, Promote the Whole Nullable Category

```xml
<PropertyGroup>
  <Nullable>enable</Nullable>
  <WarningsAsErrors>$(WarningsAsErrors);nullable</WarningsAsErrors>
  <!-- "nullable" is a warning-code CATEGORY covering all CS86xx-series nullable warnings -->
</PropertyGroup>
```

## Common Nullable Warning Codes Worth Knowing

```text
CS8600 - converting null literal or possible null value to non-nullable type
CS8602 - dereference of a possibly null reference
CS8603 - possible null reference return
CS8618 - non-nullable field/property must contain a non-null value when exiting the constructor
CS8625 - cannot convert null literal to non-nullable reference type
```

## Migration Strategy for a Large, Newly-Nullable-Enabled Codebase

```xml
<!-- Phase 1: enable nullable, warnings only -->
<Nullable>enable</Nullable>

<!-- Phase 2: fix warnings project-by-project, promoting each finished project -->
<!-- project X's csproj, once clean: -->
<WarningsAsErrors>$(WarningsAsErrors);nullable</WarningsAsErrors>

<!-- Phase 3: promote solution-wide via Directory.Build.props once every project is clean -->
```

## See Also

- [type-nullable-reference-types](type-nullable-reference-types.md) - The feature being enforced
- [proj-nullable-enable-solution-wide](proj-nullable-enable-solution-wide.md) - Enabling this solution-wide
- [lint-treat-warnings-as-errors](lint-treat-warnings-as-errors.md) - The general warnings-as-errors policy
