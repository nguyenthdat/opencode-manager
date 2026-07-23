# lint-suppress-with-justification

> Justify every analyzer/warning suppression with a comment or `Justification` attribute - never suppress silently

## Why It Matters

An unexplained `#pragma warning disable` or blanket `NoWarn` entry looks identical whether it represents a carefully-considered exception or a lazy way to make an inconvenient warning disappear. A required justification forces the suppressor to actually think through - and document for future readers - why the flagged code is genuinely fine.

## Bad

```csharp
#pragma warning disable CA2000 // dispose objects before losing scope
var stream = GetStreamFromPool(); // suppressed with zero explanation - is this actually safe?
#pragma warning restore CA2000
```

## Good

```csharp
#pragma warning disable CA2000 // dispose objects before losing scope
// Justification: `stream` is returned to the caller, who owns disposal via
// the documented contract of GetPooledStreamAsync(); this method does not
// dispose it because ownership transfers here.
var stream = GetStreamFromPool();
#pragma warning restore CA2000
```

## `[SuppressMessage]` With a Required Justification

```csharp
[SuppressMessage("Performance", "CA1822:Mark members as static",
    Justification = "Kept as an instance method to preserve the public interface contract; " +
                     "changing it to static would be a breaking API change.")]
public int GetDefaultTimeout() => 30;
```

## Suppressing at the Project Level: Still Document Why

```xml
<PropertyGroup>
  <!-- CA1014 (mark assemblies with CLSCompliant) - not applicable; this assembly
       uses unsigned integer types throughout its public API, which are not CLS-compliant. -->
  <NoWarn>$(NoWarn);CA1014</NoWarn>
</PropertyGroup>
```

## Avoid Suppressing Entire Categories

```xml
<!-- BAD: suppresses ALL Performance-category diagnostics indiscriminately -->
<NoWarn>$(NoWarn);CA18</NoWarn>

<!-- GOOD: suppress the SPECIFIC rule that's genuinely not applicable, with justification elsewhere -->
<NoWarn>$(NoWarn);CA1822</NoWarn>
```

## See Also

- [lint-treat-warnings-as-errors](lint-treat-warnings-as-errors.md) - Why suppressions matter more once warnings are errors
- [lint-roslyn-analyzers](lint-roslyn-analyzers.md) - The analyzers producing these diagnostics
