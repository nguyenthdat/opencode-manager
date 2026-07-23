# api-init-chain-nil-check

> Chain `self = [super init]` and bail out on `nil`

## Why It Matters

`-init` (and any designated initializer) can legitimately return a different object than the one `alloc` produced, or `nil` if initialization failed (isa-swizzling class clusters and some Foundation classes rely on this). Skipping the `self = [super init]` reassignment, or failing to bail out when it returns `nil`, means your initializer keeps configuring an object that either isn't the real instance or doesn't exist at all — leading to a silently broken object or a crash deep in some unrelated later call.

## Bad

```objc
- (instancetype)initWithName:(NSString *)name {
    [super init];  // Return value discarded - self is never reassigned
    _name = [name copy];  // If [super init] actually returned a different object, this sets ivars on the wrong instance
    return self;
}

- (instancetype)initWithConfiguration:(OMWConfiguration *)config {
    self = [super init];
    // No nil check - if super init failed, we keep configuring a nil-adjacent object
    _configuration = config;
    _cache = [[NSCache alloc] init];  // Runs even if self is nil, silently doing nothing (sending to nil is a no-op, but represents wasted/misleading work and disguises real failures)
    return self;
}
```

## Good

```objc
- (instancetype)initWithName:(NSString *)name {
    self = [super init];  // Always reassign self to the actual returned instance
    if (self) {           // Bail out immediately if initialization failed
        _name = [name copy];
    }
    return self;
}

- (instancetype)initWithConfiguration:(OMWConfiguration *)config {
    self = [super init];
    if (self == nil) {
        return nil;  // Propagate failure instead of silently continuing
    }
    _configuration = config;
    _cache = [[NSCache alloc] init];
    return self;
}
```

## Chaining Through Convenience Initializers

```objc
- (instancetype)init {
    // Convenience initializer chains through `self`, not `super`, to the
    // designated initializer - and still checks the result.
    self = [self initWithConfiguration:[OMWConfiguration defaultConfiguration]];
    if (self == nil) {
        return nil;
    }
    return self;
}

// Equivalently, and just as correctly, when no extra setup is needed:
- (instancetype)init {
    return [self initWithConfiguration:[OMWConfiguration defaultConfiguration]];
}
```

## Why Foundation Actually Returns a Different `self`

```objc
// NSString's class cluster may return a completely different concrete
// subclass instance from -init than the one `alloc` produced, e.g. a
// tagged-pointer or singleton empty-string instance:
NSString *s = [NSString alloc];      // Placeholder instance
s = [s init];                        // May return a totally different, real instance
// This is precisely why `self = [super init]` must reassign, not discard.
```

## See Also

- [`api-designated-initializer`](api-designated-initializer.md) - Marking which initializer this chain terminates at
- [`null-instancetype-init`](null-instancetype-init.md) - Returning `instancetype` so the reassigned type is correct
- [`api-class-cluster-pattern`](api-class-cluster-pattern.md) - Where a differing return-instance behavior originates
