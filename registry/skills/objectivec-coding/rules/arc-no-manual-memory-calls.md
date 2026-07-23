# arc-no-manual-memory-calls

> Never call `retain`/`release`/`autorelease` under ARC

## Why It Matters

Under ARC, the compiler inserts retain/release/autorelease calls for you based on ownership qualifiers and variable scope. Calling these methods manually in ARC-compiled code is a compile error (`ARC forbids explicit message send of 'release'`), and if such calls are smuggled in through `-fno-objc-arc`-flagged files or `performSelector:`, they desynchronize the compiler's inserted retain count from reality, causing over-release crashes or leaks that are extremely hard to trace back to the offending call site.

## Bad

```objc
// This file compiles under ARC and will NOT build:
- (void)cacheUser:(OMWUser *)user {
    [user retain];                 // Error: ARC forbids explicit message send of 'retain'
    self.cachedUser = user;
    [self.previousUser release];   // Error: ARC forbids explicit message send of 'release'
}

// Worse: routing around the compiler check via performSelector, which DOES
// compile and silently corrupts the retain count ARC is tracking:
[user performSelector:@selector(retain)];   // Compiles, but breaks ARC's bookkeeping
[user performSelector:@selector(release)];  // Double-release crash waiting to happen
```

## Good

```objc
// Let ARC manage ownership entirely through property attributes and locals:
- (void)cacheUser:(OMWUser *)user {
    self.cachedUser = user;  // ARC retains the new value and releases the old one for you
}

// If a specific file genuinely needs manual reference counting (e.g. wrapping
// a legacy C library), isolate it explicitly rather than fighting ARC in place:
// Build Phases -> Compile Sources -> set "-fno-objc-arc" on that one file only.
```

## The One Legitimate Escape Hatch: `@autoreleasepool`

```objc
// @autoreleasepool is a compiler-recognized scope construct, not a manual
// memory call - it's the correct, ARC-compatible way to control drain timing.
- (void)processLargeDataset:(NSArray *)items {
    for (id item in items) {
        @autoreleasepool {
            [self process:item];
        }
    }
}
```

## Detecting Accidental MRC Files

```objc
// grep your build settings/project file for -fno-objc-arc compiler flags on
// any file that isn't a deliberate, documented CF/legacy-C bridge:
// Build Settings -> "Objective-C Automatic Reference Counting" must read Yes
// for every target, and per-file overrides should be an explicit, reviewed exception.
```

## See Also

- [`arc-bridge-corefoundation`](arc-bridge-corefoundation.md) - Use `__bridge`/`CFBridgingRetain`/`CFBridgingRelease` correctly at CF/ObjC boundaries
- [`anti-manual-memory-management-arc`](anti-manual-memory-management-arc.md) - Don't call `retain`/`release`/double-`dealloc`-super under ARC
- [`arc-autoreleasepool-loop`](arc-autoreleasepool-loop.md) - Wrap tight allocation loops in `@autoreleasepool`
