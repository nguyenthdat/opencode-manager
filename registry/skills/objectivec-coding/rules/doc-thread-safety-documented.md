# doc-thread-safety-documented

> State a type's thread-safety guarantees in its header comment

## Why It Matters

Objective-C gives callers no compiler-enforced signal about whether a class is safe to touch from multiple threads. Without an explicit statement in the header, callers either assume it's safe (and hit data races/crashes) or wrap every call in defensive locking (and pay needless overhead). The only place this contract can live is documentation.

## Bad

```objc
// No mention of threading at all — is this safe from a background queue?
@interface OMWImageDownloader : NSObject
- (void)downloadImageAtURL:(NSURL *)url
                 completion:(void (^)(UIImage *_Nullable image))completion;
@end

// Silent internal locking with no external documentation of the contract
@implementation OMWImageDownloader {
    NSLock *_lock;
}
@end
```

## Good

```objc
/**
 Downloads and caches images from remote URLs.

 Thread-safety: `OMWImageDownloader` is thread-safe. All methods may be
 called concurrently from any queue; the completion block is always
 invoked on the queue passed to `-initWithCallbackQueue:`.
 */
@interface OMWImageDownloader : NSObject

- (instancetype)initWithCallbackQueue:(dispatch_queue_t)callbackQueue
    NS_DESIGNATED_INITIALIZER;

- (void)downloadImageAtURL:(NSURL *)url
                 completion:(void (^)(UIImage *_Nullable image))completion;

@end
```

## Documenting Thread-Confined (Not Thread-Safe) Types

```objc
/**
 A mutable, in-memory table view data source.

 Thread-safety: NOT thread-safe. `OMWTableDataSource` must be created,
 read, and mutated only on the main thread; it performs no internal
 synchronization. If you need to build rows on a background queue,
 construct the row array off-main and hand the finished array to
 `-replaceAllRowsWithRows:` on the main thread.
 */
@interface OMWTableDataSource : NSObject
- (void)replaceAllRowsWithRows:(NSArray<OMWRow *> *)rows;
@end
```

## Documenting Partial Safety

```objc
/**
 Thread-safety: reads (`-valueForKey:`) are safe from any queue.
 Writes (`-setValue:forKey:`) must happen on the private serial queue
 returned by `-writeQueue`; call `dispatch_async(store.writeQueue, ^{ ... })`
 rather than mutating directly.
 */
@interface OMWKeyValueStore : NSObject
@property (nonatomic, readonly) dispatch_queue_t writeQueue;
@end
```

## See Also

- [`doc-nullability-ownership-documented`](doc-nullability-ownership-documented.md) - Document nullability and ownership expectations in header comments
- [`conc-document-thread-safety-contract`](conc-document-thread-safety-contract.md) - Document the thread-confinement/thread-safety contract of shared objects
- [`conc-serial-queue-state-protection`](conc-serial-queue-state-protection.md) - Protect shared mutable state with a private serial queue instead of ad hoc locks
