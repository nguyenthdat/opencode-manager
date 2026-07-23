# lint-code-analysis-enforce-latest

> Set `AnalysisLevel` to `latest` so the project always uses the current SDK's analyzer rule set

## Why It Matters

`AnalysisLevel` defaults to matching the target framework's release version, which means a project targeting an older TFM (kept for compatibility reasons) silently misses newer analyzer rules even after upgrading the SDK. Setting it to `latest` decouples "which analyzers run" from "which runtime I target", so you always get the newest available diagnostics regardless of TFM.

## Bad

```xml
<PropertyGroup>
  <TargetFramework>net8.0</TargetFramework>
  <!-- AnalysisLevel defaults to "8.0" here - misses analyzer improvements shipped
       with newer SDKs even after the SDK itself is upgraded -->
</PropertyGroup>
```

## Good

```xml
<PropertyGroup>
  <TargetFramework>net8.0</TargetFramework>
  <AnalysisLevel>latest</AnalysisLevel> <!-- always uses the newest installed SDK's analyzer rules -->
</PropertyGroup>
```

## AnalysisLevel Value Forms

```text
latest            - newest analyzer rules, default severities
latest-recommended - newest rules, "recommended" severities (a curated, less noisy subset)
latest-all        - newest rules, ALL enabled (most strict, most noise)
6.0 / 8.0 / etc.  - pinned to a specific release's rule set (rarely desirable long-term)
```

## Combining With AnalysisMode for the Right Strictness

```xml
<PropertyGroup>
  <AnalysisLevel>latest</AnalysisLevel>
  <AnalysisMode>Recommended</AnalysisMode> <!-- Default | Minimum | Recommended | All -->
</PropertyGroup>
```

## Reviewing New Rules After an SDK Upgrade

```text
Upgrading the .NET SDK with AnalysisLevel=latest can surface NEW warnings
immediately - review and triage them deliberately as part of the SDK upgrade,
rather than being surprised by a sudden wave of build warnings/errors.
```

## See Also

- [lint-roslyn-analyzers](lint-roslyn-analyzers.md) - The analyzer package this setting configures
- [lint-treat-warnings-as-errors](lint-treat-warnings-as-errors.md) - What happens to these diagnostics once surfaced
