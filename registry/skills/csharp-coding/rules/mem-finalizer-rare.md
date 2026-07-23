# mem-finalizer-rare

> Only add a finalizer when a type directly holds an unmanaged handle; prefer `SafeHandle` instead

## Why It Matters

Finalizers add every instance to the finalization queue, delay collection by at least one extra GC generation, run on a dedicated finalizer thread with no ordering guarantees, and must never touch other managed objects (which may already be finalized). Almost every "I need a finalizer" case is better solved with `SafeHandle`, which already implements the critical finalization pattern correctly.

## Bad

```csharp
public class RawHandleResource : IDisposable
{
    private IntPtr _handle;

    public RawHandleResource() => _handle = NativeMethods.CreateHandle();

    // Adding a finalizer "just in case" - unnecessary overhead for every instance,
    // and easy to get wrong (touching other managed state here is unsafe).
    ~RawHandleResource()
    {
        NativeMethods.CloseHandle(_handle);
        _logger.LogInformation("closed"); // BUG: _logger may already be finalized
    }

    public void Dispose()
    {
        NativeMethods.CloseHandle(_handle);
        GC.SuppressFinalize(this);
    }

    private readonly ILogger _logger = NullLogger.Instance;
}
```

## Good

```csharp
public sealed class SafeNativeHandle : SafeHandleZeroOrMinusOneIsInvalid
{
    public SafeNativeHandle() : base(ownsHandle: true) { }

    protected override bool ReleaseHandle() => NativeMethods.CloseHandle(handle);
}

public sealed class Resource : IDisposable
{
    private readonly SafeNativeHandle _handle = NativeMethods.CreateHandle();

    // No finalizer needed here at all - SafeHandle's own finalizer
    // guarantees the native handle is released even if Dispose is never called.
    public void Dispose() => _handle.Dispose();
}
```

## If You Truly Must Finalize

```csharp
public class LegacyInteropWrapper : IDisposable
{
    private IntPtr _rawHandle;
    private bool _disposed;

    // Justified only when wrapping a pre-existing raw handle you cannot
    // migrate to SafeHandle (e.g. a sealed third-party struct).
    ~LegacyInteropWrapper() => Dispose(disposing: false);

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;

        // Never touch other managed objects when disposing == false;
        // only release the unmanaged handle.
        if (_rawHandle != IntPtr.Zero)
        {
            NativeMethods.CloseHandle(_rawHandle);
            _rawHandle = IntPtr.Zero;
        }

        _disposed = true;
    }
}
```

## See Also

- [mem-dispose-pattern](mem-dispose-pattern.md) - Full dispose pattern
- [mem-using-declaration](mem-using-declaration.md) - Deterministic disposal
