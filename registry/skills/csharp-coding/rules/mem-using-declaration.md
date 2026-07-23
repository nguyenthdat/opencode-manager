# mem-using-declaration

> Use `using` declarations for deterministic disposal of `IDisposable` resources

## Why It Matters

`IDisposable` resources (files, sockets, `DbConnection`, `HttpClient` handlers, etc.) hold unmanaged handles or pooled resources that must be released promptly. Relying on the GC/finalizer to clean them up delays release, can exhaust OS handles, and leaks connections under load. `using` guarantees `Dispose()` runs even when an exception is thrown.

## Bad

```csharp
public string ReadFirstLine(string path)
{
    var reader = new StreamReader(path);
    var line = reader.ReadLine();
    reader.Dispose(); // Skipped if ReadLine() throws!
    return line;
}
```

## Good

```csharp
// Block-scoped using statement
public string ReadFirstLine(string path)
{
    using (var reader = new StreamReader(path))
    {
        return reader.ReadLine();
    }
}

// C# 8+ using declaration - disposed at end of enclosing scope
public string ReadFirstLineModern(string path)
{
    using var reader = new StreamReader(path);
    return reader.ReadLine();
}

// Multiple resources - each disposed in reverse order at scope end
public void CopyFile(string source, string dest)
{
    using var input = File.OpenRead(source);
    using var output = File.OpenWrite(dest);
    input.CopyTo(output);
}
```

## Scope Matters

```csharp
// A using declaration disposes at the END of the containing block,
// not immediately after the next statement - keep the scope tight
public void ProcessLargeFile(string path)
{
    using var reader = new StreamReader(path);
    // reader stays open for the rest of this method body

    DoUnrelatedWork(); // reader is still alive here - consider a nested block
}

// Prefer an explicit block when the resource should be released early
public void ProcessThenContinue(string path)
{
    using (var reader = new StreamReader(path))
    {
        Process(reader);
    } // disposed here, before unrelated work starts

    DoUnrelatedWork();
}
```

## See Also

- [mem-await-using-async](mem-await-using-async.md) - Async disposal with `await using`
- [mem-dispose-pattern](mem-dispose-pattern.md) - Implementing `IDisposable` correctly
- [anti-region-abuse](anti-region-abuse.md) - Related resource-management hygiene
