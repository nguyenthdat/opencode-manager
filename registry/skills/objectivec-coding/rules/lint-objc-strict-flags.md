# lint-objc-strict-flags

> Build with `-Wobjc-*`/strict selector and protocol warnings enabled

## Why It Matters

Objective-C's dynamic dispatch means a typo'd selector or a mismatched method signature between a class and the category/protocol it's supposed to satisfy often only fails at runtime with `unrecognized selector sent to instance`. The `-Wobjc-*` family (`-Wobjc-method-access`, `-Wstrict-selector-match`, `-Wprotocol`, `-Wobjc-root-class`, `-Wduplicate-method-match`) catches these at compile time by cross-checking selector signatures against every visible declaration.

## Bad

```
// Strict ObjC diagnostics left at their defaults (many are off unless
// explicitly enabled), so signature mismatches slip through to runtime.
CLANG_WARN_OBJC_ROOT_CLASS = NO
CLANG_WARN__DUPLICATE_METHOD_MATCH = NO
CLANG_WARN_STRICT_PROTOTYPES = NO
```

```objc
// OMWCache.h declares one signature...
@protocol OMWCacheDelegate <NSObject>
- (void)cache:(OMWCache *)cache didEvictObjectForKey:(NSString *)key;
@end
```

```objc
// ...and OMWCacheObserver.m implements a subtly different one. Without
// -Wprotocol enabled and enforced, this compiles silently and the
// delegate callback is simply never invoked at runtime because the
// selector doesn't match what OMWCache actually calls.
@implementation OMWCacheObserver
- (void)cache:(OMWCache *)cache didEvictKey:(NSString *)key {   // Wrong
    // selector name -- never called.
    [self.analytics logEvictionForKey:key];
}
@end
```

## Good

```
// Shared.xcconfig
CLANG_WARN_OBJC_ROOT_CLASS = YES
CLANG_WARN__DUPLICATE_METHOD_MATCH = YES
CLANG_WARN_STRICT_PROTOTYPES = YES
CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES
GCC_TREAT_WARNINGS_AS_ERRORS = YES
```

```objc
// With -Wprotocol enforced (via `@implementation ... <OMWCacheDelegate>`
// and the class conforming explicitly), the compiler flags the
// mismatch immediately:
@interface OMWCacheObserver : NSObject <OMWCacheDelegate>
@end

@implementation OMWCacheObserver
// error: method 'cache:didEvictObjectForKey:' in protocol not implemented
- (void)cache:(OMWCache *)cache didEvictObjectForKey:(NSString *)key {
    [self.analytics logEvictionForKey:key];
}
@end
```

## Root Class Warning Catches a Common Mistake

```objc
// -Wobjc-root-class catches a class that forgot to inherit from
// NSObject entirely -- an easy typo when refactoring a class hierarchy.
@interface OMWPlainValueHolder   // warning: class has no designated
                                   // initializer / no superclass;
                                   // almost certainly should be
                                   // `: NSObject`.
@end
```

## See Also

- [`lint-warnings-as-errors-build-setting`](lint-warnings-as-errors-build-setting.md) - Treat warnings as errors (`GCC_TREAT_WARNINGS_AS_ERRORS`) in CI builds
- [`api-protocol-optional-required`](api-protocol-optional-required.md) - Mark each protocol method `@optional` or `@required` deliberately
- [`lint-clang-static-analyzer-ci`](lint-clang-static-analyzer-ci.md) - Run the Clang Static Analyzer in CI
