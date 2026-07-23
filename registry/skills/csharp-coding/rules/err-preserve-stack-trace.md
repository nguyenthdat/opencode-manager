# err-preserve-stack-trace

> Use `throw;` to rethrow, never `throw ex;`, to preserve the original stack trace

## Why It Matters

`throw ex;` resets the exception's stack trace to the current rethrow point, destroying the information about where it actually originated. `throw;` (no expression) rethrows the current exception while preserving its original stack trace, which is essential for diagnosing production failures.

## Bad

```csharp
try
{
    ParseFile(path);
}
catch (FormatException ex)
{
    _logger.LogError(ex, "Parse failed");
    throw ex; // resets the stack trace to THIS line - the real origin is lost
}
```

## Good

```csharp
try
{
    ParseFile(path);
}
catch (FormatException ex)
{
    _logger.LogError(ex, "Parse failed");
    throw; // preserves the original stack trace all the way to ParseFile's internals
}
```

## Wrapping Instead of Rethrowing

```csharp
// When you need to add context, wrap with an inner exception rather than losing detail
try
{
    ParseFile(path);
}
catch (FormatException ex)
{
    throw new ConfigurationException($"Invalid configuration file: {path}", ex);
    // ex becomes InnerException - its original stack trace is preserved inside it
}
```

## ExceptionDispatchInfo for Deferred Rethrow

```csharp
// When an exception must be captured on one thread/call and rethrown later
// (e.g. after leaving a catch block, or across an async boundary)
ExceptionDispatchInfo? captured = null;

try
{
    DoWork();
}
catch (Exception ex)
{
    captured = ExceptionDispatchInfo.Capture(ex);
}

if (captured is not null)
{
    LogBeforeRethrow();
    captured.Throw(); // rethrows with the ORIGINAL stack trace, from outside the catch
}
```

## See Also

- [err-exception-filters-when](err-exception-filters-when.md) - Filtering without disturbing the trace
- [err-wrap-with-innerexception](err-wrap-with-innerexception.md) - Wrapping with context
- [anti-throw-ex-loses-stack](anti-throw-ex-loses-stack.md) - Anti-pattern reference
