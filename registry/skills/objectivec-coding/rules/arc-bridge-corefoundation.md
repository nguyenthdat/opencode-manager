# arc-bridge-corefoundation

> Use `__bridge`/`CFBridgingRetain`/`CFBridgingRelease` correctly at CF/ObjC boundaries

## Why It Matters

Core Foundation types are not managed by ARC; they use manual `CFRetain`/`CFRelease`. Whenever an Objective-C object crosses into a CF-typed variable (or vice versa), ARC needs an explicit bridging cast telling it who owns the memory afterward. Using the wrong cast either leaks the CF object forever (nobody ever calls `CFRelease`) or double-frees it (ARC releases an object that CF still thinks it owns), and both classes of bug are notoriously hard to reproduce because they depend on retain-count timing.

## Bad

```objc
- (CGImageRef)createImageFromUIImage:(UIImage *)image {
    CGImageRef cgImage = image.CGImage;
    CFRetain(cgImage);          // Manually retaining without a matching, documented release
    return cgImage;              // Caller has no idea they now own a +1 CF reference
}

- (NSString *)stringFromCFString:(CFStringRef)cfString {
    NSString *result = (__bridge NSString *)cfString;  // __bridge doesn't transfer ownership...
    CFRelease(cfString);  // ...but we release here anyway - now `result` can dangle if CF was the only owner
    return result;
}
```

## Good

```objc
- (CGImageRef)createImageFromUIImage:(UIImage *)image CF_RETURNS_RETAINED {
    // CFBridgingRetain hands ARC's +1 ownership over to Core Foundation explicitly;
    // caller is now responsible for calling CGImageRelease/CFRelease.
    return (CGImageRef)CFBridgingRetain(image.CGImage);
}

- (NSString *)stringFromCFString:(CFStringRef)cfString {
    // __bridge_transfer converts CF ownership to ARC ownership in one step:
    // ARC now owns the +1 reference and will release it when `result` goes out of scope.
    NSString *result = (__bridge_transfer NSString *)CFStringCreateCopy(NULL, cfString);
    return result;
}
```

## The Three Bridging Casts

```objc
// __bridge: no ownership transfer - the CF object's existing owner is still responsible.
// Use only when the CF object is guaranteed to outlive this cast's use.
NSString *nsStr = (__bridge NSString *)someCFStringStillOwnedElsewhere;

// __bridge_retained / CFBridgingRetain: ARC hands its +1 to Core Foundation.
// You must CFRelease the result yourself.
CFStringRef cfStr = (__bridge_retained CFStringRef)someNSString;

// __bridge_transfer / CFBridgingRelease: Core Foundation hands its +1 to ARC.
// ARC will release it for you; do NOT CFRelease it yourself afterward.
NSString *owned = (__bridge_transfer NSString *)CFStringCreateWithCString(NULL, "hi", kCFStringEncodingUTF8);
```

## Matching CF "Create Rule" Functions

```objc
// Any CF function with Create or Copy in its name follows the Create Rule:
// you own the +1 and must release it. Bridge it into ARC immediately with
// __bridge_transfer so you never have to remember a manual CFRelease:
CFUUIDRef uuidRef = CFUUIDCreate(NULL);
NSString *uuidString = (__bridge_transfer NSString *)CFUUIDCreateString(NULL, uuidRef);
CFRelease(uuidRef);  // uuidRef itself was never bridged, so it still needs a manual release
```

## See Also

- [`arc-no-manual-memory-calls`](arc-no-manual-memory-calls.md) - Never call `retain`/`release`/`autorelease` under ARC
- [`proj-mm-suffix-for-cpp-interop`](proj-mm-suffix-for-cpp-interop.md) - Use `.mm` only for files that actually need C++ interop
- [`null-audited-region-c-api`](null-audited-region-c-api.md) - Wrap nullability-audited C function regions explicitly
