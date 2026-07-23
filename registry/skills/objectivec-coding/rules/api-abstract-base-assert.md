# api-abstract-base-assert

> Enforce abstract-method contracts with `NSAssert`/subclass-responsibility exceptions

## Why It Matters

Objective-C has no language-level `abstract` keyword, so an "abstract" base class's unimplemented methods will silently do nothing (or return garbage) if a subclass forgets to override them, unless the base class explicitly asserts or throws. A loud, immediate failure the first time an unimplemented abstract method actually runs is far cheaper to diagnose than a subtly wrong result surfacing much later in unrelated code.

## Bad

```objc
@interface OMWShape : NSObject
- (double)area;
@end

@implementation OMWShape

- (double)area {
    return 0.0;  // Silent placeholder - a forgotten subclass override just reports "0 area" forever
}

@end

@implementation OMWCircle : OMWShape
// Oops - forgot to override -area. Callers get 0.0 with no indication anything is wrong.
@end
```

## Good

```objc
@interface OMWShape : NSObject
- (double)area;
@end

@implementation OMWShape

- (double)area {
    // Loud, immediate failure the moment an unimplemented subclass calls this.
    NSAssert(NO, @"%@ must override -area", NSStringFromClass([self class]));
    return 0.0;  // Unreachable in a build with assertions enabled, but keeps the type checker happy
}

@end

@implementation OMWCircle : OMWShape
@synthesize radius = _radius;

- (double)area {
    return M_PI * _radius * _radius;  // Correctly overridden
}
@end

@implementation OMWTriangle : OMWShape
// Forgot to override -area: this now crashes loudly and immediately in
// debug/test builds instead of silently returning 0.0.
@end
```

## Using an Exception Instead of NSAssert

```objc
// NSAssert compiles out entirely when NS_BLOCK_ASSERTIONS is defined (common
// in release builds), so if you need the guard to survive into release
// builds too, throw explicitly instead:
- (double)area {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                    reason:[NSString stringWithFormat:@"%@ must override -area",
                                            NSStringFromClass([self class])]
                                  userInfo:nil];
}
```

## Runtime Introspection Alternative

```objc
// For a stronger compile-adjacent guarantee, some codebases check at
// +initialize time that every concrete subclass overrides the method,
// catching the mistake at class-load time rather than first call:
+ (void)initialize {
    if (self != [OMWShape class]) {
        NSAssert([self instancesRespondToSelector:@selector(area)] &&
                 [self instanceMethodForSelector:@selector(area)] !=
                 [OMWShape instanceMethodForSelector:@selector(area)],
                 @"%@ must override -area", self);
    }
}
```

## See Also

- [`api-class-cluster-pattern`](api-class-cluster-pattern.md) - Abstract superclasses are common in class clusters
- [`err-exception-programmer-only`](err-exception-programmer-only.md) - Why this is a programmer-error case, not `NSError`
- [`api-designated-initializer`](api-designated-initializer.md) - Another place subclass contracts must be enforced
