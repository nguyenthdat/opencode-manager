# conc-dispatch-once-singleton

> Use `dispatch_once` for thread-safe singleton/lazy initialization

## Why It Matters

A singleton accessor without synchronization can run its initialization code twice under concurrent access - two threads both see a `nil` cached instance and both allocate one, producing two distinct "singletons" whose state silently diverges. `dispatch_once` guarantees the initialization block runs exactly once, is safe under concurrent callers, and blocks any thread that arrives while initialization is still in progress.

## Bad

```objc
@implementation OMWSessionManager

+ (instancetype)sharedManager {
    static OMWSessionManager *sharedInstance;
    if (sharedInstance == nil) {
        // Two threads can both pass this nil check before either assignment lands.
        sharedInstance = [[OMWSessionManager alloc] init];
    }
    return sharedInstance;
}

@end
```

## Good

```objc
@implementation OMWSessionManager

+ (instancetype)sharedManager {
    static OMWSessionManager *sharedInstance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[OMWSessionManager alloc] init];
    });
    return sharedInstance;
}

@end
```

## Lazy, Non-Singleton Initialization

```objc
// dispatch_once also works for expensive, lazily-computed statics that
// are not singletons - e.g. a shared, immutable regex or date formatter.
+ (NSDateFormatter *)iso8601Formatter {
    static NSDateFormatter *formatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        formatter = [[NSDateFormatter alloc] init];
        formatter.dateFormat = @"yyyy-MM-dd'T'HH:mm:ssZZZZZ";
        formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
    });
    return formatter;
}
```

## Why Not a Plain `@synchronized` Check-Then-Set

```objc
// Works, but pays a lock acquisition on every single call forever,
// even after the instance already exists. dispatch_once only pays
// the synchronization cost once (subsequent calls are a cheap check).
+ (instancetype)sharedManagerSynchronized {
    static OMWSessionManager *sharedInstance;
    @synchronized (self) {
        if (sharedInstance == nil) {
            sharedInstance = [[OMWSessionManager alloc] init];
        }
    }
    return sharedInstance;
}
```

## See Also

- [`conc-synchronized-scope-minimal`](conc-synchronized-scope-minimal.md) - Keep `@synchronized` blocks minimal and never nested
- [`anti-singleton-overuse`](anti-singleton-overuse.md) - Don't reach for a singleton as the default access pattern
- [`perf-lazy-property-initialization`](perf-lazy-property-initialization.md) - Lazily initialize expensive properties on first access
