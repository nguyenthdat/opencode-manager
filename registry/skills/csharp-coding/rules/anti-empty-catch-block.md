# anti-empty-catch-block

> Don't leave empty catch blocks that silently discard exceptions

## Why It Matters

An empty `catch { }` erases all evidence that something went wrong - no log entry, no metric, nothing. The program continues in a state its author never actually planned for, and any resulting downstream failure has no trace back to its real cause.

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
        // nothing here - the failure vanishes without a trace
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
        return false;
    }
}
```

## If Ignoring Really Is Correct, Say Why

```csharp
try
{
    tempFile.Delete();
}
catch (IOException)
{
    // Best-effort cleanup; safe to ignore because the OS reclaims temp files
    // on reboot, and this deletion racing with an antivirus scan is expected.
}
```

## See Also

- [err-dont-swallow](err-dont-swallow.md) - The full rule with more detail
- [err-finally-cleanup](err-finally-cleanup.md) - Structuring cleanup without hiding failures
