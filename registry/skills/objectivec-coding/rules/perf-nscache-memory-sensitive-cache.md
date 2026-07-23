# perf-nscache-memory-sensitive-cache

> Use `NSCache` instead of a plain dictionary for memory-sensitive caches

## Why It Matters

An `NSMutableDictionary` used as a cache grows without bound and holds every entry strongly forever, so under memory pressure it can push the app into a jetsam/OOM kill instead of gracefully shrinking. `NSCache` automatically evicts entries when the system signals memory pressure, is thread-safe for concurrent access without extra locking, and supports per-entry cost limits — all of which a bare dictionary requires you to hand-roll incorrectly.

## Bad

```objc
@interface OMWImageCache ()
@property (nonatomic, strong) NSMutableDictionary<NSURL *, UIImage *> *storage;
@end

@implementation OMWImageCache

- (void)cacheImage:(UIImage *)image forURL:(NSURL *)url {
    // Never evicts. Under memory pressure this dictionary just keeps
    // growing until the OS kills the app.
    self.storage[url] = image;
}

- (UIImage *)imageForURL:(NSURL *)url {
    // Also needs manual locking if accessed from multiple queues.
    return self.storage[url];
}

@end
```

## Good

```objc
@interface OMWImageCache ()
@property (nonatomic, strong) NSCache<NSURL *, UIImage *> *storage;
@end

@implementation OMWImageCache

- (instancetype)init {
    self = [super init];
    if (self) {
        _storage = [[NSCache alloc] init];
        _storage.name = @"com.omw.imageCache";
        _storage.countLimit = 200;               // eviction trigger #1
        _storage.totalCostLimit = 50 * 1024 * 1024; // 50 MB, eviction trigger #2
    }
    return self;
}

- (void)cacheImage:(UIImage *)image forURL:(NSURL *)url {
    NSUInteger cost = (NSUInteger)(image.size.width * image.size.height * 4); // approx bytes
    [self.storage setObject:image forKey:url cost:cost];
}

- (nullable UIImage *)imageForURL:(NSURL *)url {
    // Thread-safe: NSCache handles its own internal synchronization.
    return [self.storage objectForKey:url];
}

@end
```

## Responding to Memory Warnings Explicitly

```objc
// NSCache already purges under system pressure automatically, but you
// can also proactively drop your own cache on the documented app-wide
// memory-warning notification for faster recovery.
- (void)registerForMemoryWarnings {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                              selector:@selector(handleMemoryWarning)
                                                  name:UIApplicationDidReceiveMemoryWarningNotification
                                                object:nil];
}

- (void)handleMemoryWarning {
    [self.storage removeAllObjects];
}
```

## NSCache Does Not Guarantee Retention

```objc
// NSCache may evict an entry at any time, even without memory pressure,
// as an implementation detail. Never rely on a cached value still being
// there — always handle the objectForKey: nil case as a normal cache miss.
UIImage *cached = [cache objectForKey:url];
if (cached == nil) {
    // Recompute or refetch — this is expected, not exceptional.
}
```

## See Also

- [`perf-lazy-property-initialization`](perf-lazy-property-initialization.md) - Lazily initialize expensive properties on first access
- [`perf-decode-image-off-main`](perf-decode-image-off-main.md) - Decode/resize images off the main thread
- [`anti-singleton-overuse`](anti-singleton-overuse.md) - Don't reach for a singleton as the default access pattern
