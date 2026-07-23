# anti-throw-ex-loses-stack

> Don't use `throw ex;` when rethrowing - it discards the original stack trace

## Why It Matters

`throw ex;` resets the exception's stack trace to the rethrow point, erasing the information about where the exception actually originated - exactly the information you need to diagnose a production failure.

## Bad

```csharp
try
{
    ParseFile(path);
}
catch (FormatException ex)
{
    _logger.LogError(ex, "Parse failed");
    throw ex; // stack trace now points here, not to the real failure inside ParseFile
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
    throw; // preserves the original stack trace, all the way into ParseFile's internals
}
```

## Wrapping Instead of Rethrowing Bare

```csharp
catch (FormatException ex)
{
    throw new ConfigurationException($"Invalid configuration file: {path}", ex); // preserves ex as InnerException
}
```

## See Also

- [err-preserve-stack-trace](err-preserve-stack-trace.md) - The full rule with more detail
- [err-wrap-with-innerexception](err-wrap-with-innerexception.md) - Wrapping while preserving the cause
