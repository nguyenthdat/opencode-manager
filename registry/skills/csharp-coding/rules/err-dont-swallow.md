# err-dont-swallow

> Never swallow exceptions silently with an empty catch block

## Why It Matters

An empty `catch { }` (or one that only comments "ignore") hides failures completely - no log, no metric, no trace. The program keeps running in a state the author never anticipated, and when something downstream breaks, there is no record of the real root cause.

## Bad

```csharp
public void SaveSettings(Settings settings)
{
    try
    {
        File.WriteAllText(_path, JsonSerializer.Serialize(settings));
    }
    catch
    {
        // ignore - swallowed with zero trace of what happened
    }
}
```

## Good

```csharp
public bool TrySaveSettings(Settings settings)
{
    try
    {
        File.WriteAllText(_path, JsonSerializer.Serialize(settings));
        return true;
    }
    catch (IOException ex)
    {
        _logger.LogWarning(ex, "Failed to save settings to {Path}", _path);
        return false; // caller can decide how to react - the failure is visible and handled
    }
}
```

## If You Truly Must Ignore an Exception

```csharp
// Rare, deliberate cases (e.g. "best effort" cleanup) still deserve a comment
// explaining WHY it's safe to ignore, and should be scoped to the specific exception.
try
{
    tempFile.Delete();
}
catch (IOException)
{
    // Best-effort cleanup of a temp file; failure here is harmless because the
    // OS will reclaim the temp directory on next reboot. Intentionally not logged
    // to avoid noise for this expected, low-impact race with antivirus scanners.
}
```

## See Also

- [err-finally-cleanup](err-finally-cleanup.md) - Structuring cleanup without hiding failures
- [err-no-catch-exception](err-no-catch-exception.md) - Catching too broadly is a related smell
- [anti-empty-catch-block](anti-empty-catch-block.md) - Anti-pattern reference
