# err-wrap-with-innerexception

> When wrapping and rethrowing, always pass the original exception as `innerException`

## Why It Matters

Wrapping a low-level exception in a higher-level, more meaningful one is good practice - but only if the original exception is preserved as `InnerException`. Without it, the root cause (the actual `SqlException`, `IOException`, etc.) is lost forever, leaving only the wrapper's message for diagnosis.

## Bad

```csharp
public Config LoadConfig(string path)
{
    try
    {
        return ParseConfig(File.ReadAllText(path));
    }
    catch (Exception ex)
    {
        // Original exception (type, message, stack trace) is discarded entirely
        throw new ConfigurationException($"Failed to load config from {path}: {ex.Message}");
    }
}
```

## Good

```csharp
public Config LoadConfig(string path)
{
    try
    {
        return ParseConfig(File.ReadAllText(path));
    }
    catch (Exception ex)
    {
        // Original exception preserved as InnerException - visible in logs, in
        // ex.ToString(), and walkable via ex.InnerException in a debugger.
        throw new ConfigurationException($"Failed to load config from {path}.", ex);
    }
}

public sealed class ConfigurationException : Exception
{
    public ConfigurationException(string message, Exception? inner = null)
        : base(message, inner) { }
}
```

## Logging the Full Chain

```csharp
try
{
    LoadConfig(path);
}
catch (ConfigurationException ex)
{
    // ILogger's exception overload logs the full ToString(), including InnerException
    _logger.LogError(ex, "Startup failed");

    // Or walk it manually
    for (var current = (Exception?)ex; current is not null; current = current.InnerException)
    {
        Console.WriteLine($"{current.GetType().Name}: {current.Message}");
    }
}
```

## See Also

- [err-custom-hierarchy](err-custom-hierarchy.md) - Exception types with standard constructors
- [err-preserve-stack-trace](err-preserve-stack-trace.md) - Preserving traces when rethrowing
- [err-aggregateexception-flatten](err-aggregateexception-flatten.md) - Chains from parallel operations
