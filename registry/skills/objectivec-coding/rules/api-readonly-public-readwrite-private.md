# api-readonly-public-readwrite-private

> Expose `readonly` publicly, redeclare `readwrite` in a private extension

## Why It Matters

A property a class manages internally (current state, cached values, computed results) should never be directly settable by external callers, or they can put the object into an inconsistent state that bypasses your own invariants and side effects. Declaring it `readonly` in the public header and redeclaring the identical property `readwrite` in a private class extension gives external callers a read-only view while letting the implementation file assign it normally through the synthesized setter — no custom setter method required.

## Bad

```objc
// OMWDownloadTask.h
NS_ASSUME_NONNULL_BEGIN

@interface OMWDownloadTask : NSObject

// Publicly settable - a caller can do `task.progress = 1.0` and lie about
// download completion, or `task.state = OMWDownloadStateFinished` early.
@property (nonatomic, assign) double progress;
@property (nonatomic, assign) OMWDownloadState state;

@end

NS_ASSUME_NONNULL_END
```

## Good

```objc
// OMWDownloadTask.h - public, read-only view
NS_ASSUME_NONNULL_BEGIN

@interface OMWDownloadTask : NSObject

@property (nonatomic, readonly) double progress;
@property (nonatomic, readonly) OMWDownloadState state;

@end

NS_ASSUME_NONNULL_END

// OMWDownloadTask.m - private extension redeclares them readwrite
@interface OMWDownloadTask ()

@property (nonatomic, readwrite) double progress;
@property (nonatomic, readwrite) OMWDownloadState state;

@end

@implementation OMWDownloadTask

- (void)urlSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
   didSendBodyData:(int64_t)bytesSent
    totalBytesSent:(int64_t)totalBytesSent
totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend {
    // Uses the synthesized setter internally - no custom setter method needed
    self.progress = (double)totalBytesSent / (double)totalBytesExpectedToSend;
}

- (void)markFinished {
    self.state = OMWDownloadStateFinished;  // Only the class itself can transition state
}

@end

// External caller can read, but the compiler rejects a direct write:
double p = task.progress;       // OK
task.progress = 1.0;            // Compile error: readonly property
```

## Redeclaring Collection Properties (Watch the Generics)

```objc
// The redeclaration must repeat the exact generic parameterization, or the
// compiler treats it as a different property and silently loses type safety.
// Public:
@property (nonatomic, readonly) NSArray<OMWDownloadTask *> *activeTasks;
// Private redeclaration - generics preserved:
@property (nonatomic, readwrite) NSArray<OMWDownloadTask *> *activeTasks;
```

## See Also

- [`api-class-extension-private-api`](api-class-extension-private-api.md) - The class-extension mechanism this relies on
- [`api-property-attribute-discipline`](api-property-attribute-discipline.md) - Choosing attributes deliberately in general
- [`null-generic-mutable-subclass`](null-generic-mutable-subclass.md) - Preserving generics on mutable collection return types
