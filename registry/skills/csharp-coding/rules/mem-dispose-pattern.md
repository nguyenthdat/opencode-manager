# mem-dispose-pattern

> Implement the full `IDisposable` dispose pattern when a type directly owns unmanaged resources or other disposables

## Why It Matters

A naive `Dispose()` method that only releases managed resources is fine for most types, but a type that owns unmanaged handles (or must support being disposed multiple times, or subclassing) needs the complete pattern: a protected virtual `Dispose(bool)`, a finalizer only if truly needed, and `GC.SuppressFinalize`. Getting this wrong leaks native handles or throws on double-dispose.

## Bad

```csharp
public class FileWrapper : IDisposable
{
    private FileStream _stream = new FileStream("data.bin", FileMode.Open);

    public void Dispose()
    {
        _stream.Dispose();
        // No protection against double-dispose, no support for subclassing,
        // no way for derived types to release their own resources safely.
    }
}
```

## Good

```csharp
public class FileWrapper : IDisposable
{
    private FileStream? _stream = new FileStream("data.bin", FileMode.Open);
    private bool _disposed;

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed)
        {
            return;
        }

        if (disposing)
        {
            _stream?.Dispose(); // release other managed IDisposables here
            _stream = null;
        }

        // release unmanaged resources here (none in this example)
        _disposed = true;
    }

    public void ReadHeader()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        // ... use _stream
    }
}
```

## When a Finalizer Is Needed

```csharp
public class NativeHandleWrapper : IDisposable
{
    private IntPtr _handle;
    private bool _disposed;

    public NativeHandleWrapper(IntPtr handle) => _handle = handle;

    // Only add a finalizer when you hold a raw native handle directly
    // (prefer SafeHandle instead - see mem-finalizer-rare).
    ~NativeHandleWrapper() => Dispose(disposing: false);

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed)
        {
            return;
        }

        if (disposing)
        {
            // dispose managed IDisposable fields
        }

        if (_handle != IntPtr.Zero)
        {
            NativeMethods.CloseHandle(_handle);
            _handle = IntPtr.Zero;
        }

        _disposed = true;
    }
}
```

## Subclassing a Disposable Base

```csharp
public class BufferedFileWrapper : FileWrapper
{
    private MemoryStream? _buffer = new();

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _buffer?.Dispose();
            _buffer = null;
        }

        base.Dispose(disposing); // always call base last
    }
}
```

## See Also

- [mem-finalizer-rare](mem-finalizer-rare.md) - When finalizers are actually necessary
- [mem-using-declaration](mem-using-declaration.md) - Consuming `IDisposable` correctly
- [mem-await-using-async](mem-await-using-async.md) - Async counterpart
