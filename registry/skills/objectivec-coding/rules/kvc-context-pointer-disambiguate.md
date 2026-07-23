# kvc-context-pointer-disambiguate

> Disambiguate KVO callbacks with a private static context pointer

## Why It Matters

`-observeValueForKeyPath:ofObject:change:context:` is a single shared entry point for every KVO registration on an object, including ones added by superclasses, categories, or third-party libraries you don't control. Comparing only `keyPath` strings is fragile - two unrelated observations can share a key path name (e.g. two different classes both observing `"state"`), and a string comparison can't tell them apart or won't forward unrecognized callbacks to `super`, silently swallowing a superclass's own KVO handling.

## Bad

```objc
- (void)viewDidLoad {
    [super viewDidLoad];
    [self.task addObserver:self forKeyPath:@"state" options:0 context:NULL];
    [self.connection addObserver:self forKeyPath:@"state" options:0 context:NULL];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object
                         change:(NSDictionary *)change context:(void *)context {
    // Both registrations use the same string key path and pass context:NULL,
    // so this can't reliably tell which object changed, and it never calls
    // super, silently breaking any KVO the superclass relies on.
    if ([keyPath isEqualToString:@"state"]) {
        [self refreshEverything]; // Wrong object might have triggered this.
    }
}
```

## Good

```objc
static void *OMWTaskStateContext = &OMWTaskStateContext;
static void *OMWConnectionStateContext = &OMWConnectionStateContext;

- (void)viewDidLoad {
    [super viewDidLoad];
    [self.task addObserver:self forKeyPath:@"state" options:0 context:OMWTaskStateContext];
    [self.connection addObserver:self forKeyPath:@"state" options:0 context:OMWConnectionStateContext];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object
                         change:(NSDictionary *)change context:(void *)context {
    if (context == OMWTaskStateContext) {
        [self refreshTaskStatus];
        return;
    }
    if (context == OMWConnectionStateContext) {
        [self refreshConnectionStatus];
        return;
    }
    // Anything not ours gets forwarded, so a superclass's own KVO still works.
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
}
```

## Why a Static Pointer, Not a String Constant

```objc
// A string constant's address is not guaranteed distinct from another
// equal-valued string literal after compiler string pooling, and
// comparing string *contents* (isEqualToString:) reintroduces the
// original ambiguity. A file-static void* is guaranteed unique by
// virtue of being a distinct storage location.
static void *OMWTaskStateContext = &OMWTaskStateContext; // Address of itself: always unique.
```

## See Also

- [`kvc-observe-specific-keypath`](kvc-observe-specific-keypath.md) - Observe specific, well-scoped key paths, not broad wildcard state
- [`kvc-remove-observer-before-dealloc`](kvc-remove-observer-before-dealloc.md) - Always remove KVO observers before the observed object deallocates
- [`kvc-manual-change-notification`](kvc-manual-change-notification.md) - Call `willChangeValueForKey:`/`didChangeValueForKey:` when hand-rolling KVO
