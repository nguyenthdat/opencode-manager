# err-finally-cleanup

> Use `finally` (or `using`) for guaranteed cleanup instead of duplicating it across every catch block

## Why It Matters

Cleanup logic copy-pasted into every `catch` block (and the happy path) drifts out of sync and gets missed on new exception types. `finally` runs regardless of how the `try` block exits - normal completion, an exception, or a `return` - guaranteeing the cleanup runs exactly once.

## Bad

```csharp
public void Process(string path)
{
    var conn = OpenConnection();
    try
    {
        DoWork(conn);
    }
    catch (TimeoutException)
    {
        conn.Close(); // duplicated...
        throw;
    }
    catch (IOException)
    {
        conn.Close(); // ...and duplicated again...
        throw;
    }
    conn.Close(); // ...and duplicated once more for the happy path
}
```

## Good

```csharp
public void Process(string path)
{
    var conn = OpenConnection();
    try
    {
        DoWork(conn);
    }
    finally
    {
        conn.Close(); // runs exactly once, on every exit path
    }
}

// For IDisposable resources, using already generates this pattern for you
public void ProcessDisposable(string path)
{
    using var conn = OpenConnectionDisposable();
    DoWork(conn);
}
```

## Finally Runs Even With a Return

```csharp
public int ReadCount(string path)
{
    var reader = OpenReader(path);
    try
    {
        return reader.Count; // finally still executes before the method actually returns
    }
    finally
    {
        reader.Dispose();
    }
}
```

## Don't Swallow Exceptions in Finally

```csharp
// BAD: an exception thrown inside finally replaces/masks the original exception
public void Bad()
{
    try
    {
        throw new InvalidOperationException("original");
    }
    finally
    {
        Cleanup(); // if Cleanup() throws, the "original" exception is lost
    }
}

// GOOD: guard cleanup code that can itself fail
finally
{
    try { Cleanup(); } catch (Exception cleanupEx) { _logger.LogWarning(cleanupEx, "cleanup failed"); }
}
```

## See Also

- [mem-using-declaration](mem-using-declaration.md) - `using` as sugar over try/finally
- [err-dont-swallow](err-dont-swallow.md) - Not hiding failures during cleanup either
