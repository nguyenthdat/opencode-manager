# arc-copy-block-property

> Use `copy` for block-typed properties

## Why It Matters

Blocks created as stack-based literals start out on the stack; the compiler generally promotes them under ARC, but the historical and still-correct convention is to explicitly `copy` block properties so a block is guaranteed to be moved (retained) onto the heap and live independently of the scope that created it. Declaring a block property `strong` instead of `copy` works in most cases under modern ARC, but it is non-obvious to readers, inconsistent with Apple's own headers, and can bite you in mixed ARC/MRC code or older toolchains where the block may still live on the stack when captured.

## Bad

```objc
@interface OMWNetworkClient : NSObject
@property (nonatomic, strong) void (^completionHandler)(NSData *data, NSError *error);  // Should be copy
@end

- (void)fetchDataWithCompletion:(void (^)(NSData *data, NSError *error))completion {
    self.completionHandler = completion;  // Relies on ARC's implicit block copy-on-assign behavior
}
```

## Good

```objc
@interface OMWNetworkClient : NSObject
@property (nonatomic, copy) void (^completionHandler)(NSData *data, NSError *error);
@end

- (void)fetchDataWithCompletion:(void (^)(NSData *data, NSError *error))completion {
    self.completionHandler = completion;  // Explicitly documents "this block escapes and is retained"
}
```

## Declaring a Reusable Block Type

```objc
// Name the block type with a typedef so the property declaration stays readable
typedef void (^OMWDataCompletionHandler)(NSData *_Nullable data, NSError *_Nullable error);

@interface OMWNetworkClient : NSObject
@property (nonatomic, copy, nullable) OMWDataCompletionHandler completionHandler;
@end
```

## Why `copy` Still Matters at the ABI Boundary

```objc
// When a block crosses into C APIs that store it (e.g. dispatch_after, or a
// C struct holding a block pointer), an implicit ARC copy may not happen for
// you. Copy explicitly before storing in non-ARC-managed storage:
void OMWScheduleCallback(void (^callback)(void)) {
    void (^storedCallback)(void) = [callback copy];  // Explicit copy before storing
    gGlobalCallbackStorage = storedCallback;          // Now safe to use after this function returns
}
```

## See Also

- [`arc-weak-strong-self`](arc-weak-strong-self.md) - Capture `__weak self` then re-strengthen inside blocks to avoid retain cycles
- [`arc-copy-value-objects`](arc-copy-value-objects.md) - Use `copy` (not `strong`) for `NSString`/`NSArray`/`NSDictionary` properties
- [`null-noescape-block-param`](null-noescape-block-param.md) - Annotate non-escaping block parameters with `NS_NOESCAPE`
