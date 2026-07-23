# anti-manual-memory-management-arc

> Don't call `retain`/`release`/double-`dealloc`-super under ARC

## Why It Matters

Under ARC, the compiler inserts every retain and release call for you based on ownership qualifiers (`strong`/`weak`/`unsafe_unretained`) and automatically-managed scope. Manually calling `retain`, `release`, or `autorelease`, or explicitly calling `[super dealloc]`, is not just redundant under ARC — it's a compile error, because ARC forbids these selectors entirely to guarantee its retain-count bookkeeping stays consistent. Code that still contains these calls is either leftover from an incomplete MRC-to-ARC migration or a `-fno-objc-arc` file masquerading as ARC-managed, and either way it signals the ownership model for that file is not what the rest of the target assumes.

## Bad

```objc
// This file compiles only because it was never actually migrated to
// ARC -- it still has -fno-objc-arc set in Build Phases > Compile
// Sources, silently opting the file out of automatic memory management
// while every other file in the target assumes ARC.
- (void)cacheUser:(OMWUser *)user {
    [user retain];             // Illegal under ARC; compiles only
    self.cachedUser = user;     // because this file is MRC-only.
    [_previousCachedUser release];
    _previousCachedUser = _cachedUser;
}

- (void)dealloc {
    [_cachedUser release];
    [super dealloc];            // Illegal under ARC.
}
```

## Good

```objc
// Under ARC, ownership is expressed via the property attribute, and
// the compiler inserts the correct retain/release calls for you.
@property (nonatomic, strong) OMWUser *cachedUser;

- (void)cacheUser:(OMWUser *)user {
    self.cachedUser = user;   // ARC retains the new value and releases
                                // the old one automatically.
}

- (void)dealloc {
    // No manual release calls and no [super dealloc] -- ARC handles
    // both. Use dealloc only to remove observers/invalidate timers.
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}
```

## Detecting a File Silently Opted Out of ARC

```
// Xcode: Target > Build Phases > Compile Sources > Compiler Flags
// column. A file listed with "-fno-objc-arc" is manually managed even
// though the rest of the target is ARC. Audit this list periodically;
// every entry should have a specific, documented reason (e.g. a legacy
// Core Foundation-heavy file that hasn't been migrated yet).
OMWLegacyImageCache.m    -fno-objc-arc
```

## Migrating a File to ARC

```bash
# Xcode's automated migrator handles the bulk conversion, including
# removing retain/release/autorelease calls and inserting the correct
# ownership qualifiers, but always review the diff -- especially
# around Core Foundation bridging, which the tool cannot always infer.
# Edit > Refactor > Convert to Objective-C ARC...
```

## See Also

- [`arc-no-manual-memory-calls`](arc-no-manual-memory-calls.md) - Never call `retain`/`release`/`autorelease` under ARC
- [`arc-bridge-corefoundation`](arc-bridge-corefoundation.md) - Use `__bridge`/`CFBridgingRetain`/`CFBridgingRelease` correctly at CF/ObjC boundaries
- [`arc-dealloc-observer-cleanup`](arc-dealloc-observer-cleanup.md) - Remove observers and invalidate timers in `dealloc`
