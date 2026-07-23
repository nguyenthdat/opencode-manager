# name-class-prefix-framework

> Prefix classes with a 2-3 letter code when shipping a library/framework

## Why It Matters

Objective-C's single global namespace means two frameworks that both declare a class named `Logger` or `NetworkClient` will crash the app at link time with a duplicate-symbol error, or silently pick whichever implementation the linker loads first. A short, distinctive prefix (reserved outside `NS`/`UI`/`CA`/Apple's two-letter prefixes) is the only namespacing mechanism Objective-C has, and it is required by Swift interop too since Swift uses the prefix to decide what to strip when importing the type.

## Bad

```objc
// OMWKit.framework
@interface NetworkClient : NSObject      // Collides with any app or SDK using "NetworkClient"
- (void)fetchData:(NSString *)urlString completion:(void (^)(NSData *data))completion;
@end

@interface Logger : NSObject             // Extremely common name, high collision risk
+ (void)log:(NSString *)message;
@end

@interface User : NSObject               // Bare "User" is almost guaranteed to collide
@property (nonatomic, copy) NSString *name;
@end
```

## Good

```objc
// OMWKit.framework - "OMW" is this framework's reserved prefix
@interface OMWNetworkClient : NSObject
- (void)fetchDataFromURLString:(NSString *)urlString
                     completion:(void (^)(NSData *_Nullable data))completion;
@end

@interface OMWLogger : NSObject
+ (void)logMessage:(NSString *)message;
@end

@interface OMWUser : NSObject
@property (nonatomic, copy) NSString *name;
@end
```

## Prefixing Protocols and Constants Too

The same collision risk applies to anything that lives in the global namespace, not just classes:

```objc
@protocol OMWNetworkClientDelegate <NSObject>
- (void)networkClient:(OMWNetworkClient *)client didFailWithError:(NSError *)error;
@end

typedef NS_ENUM(NSInteger, OMWNetworkClientState) {
    OMWNetworkClientStateIdle,
    OMWNetworkClientStateFetching,
};

FOUNDATION_EXPORT NSString *const OMWNetworkClientErrorDomain;
```

## When an App Target Can Skip the Prefix

```objc
// Application (not framework/library) targets sharing one executable
// generally don't need a prefix, since there's no second consumer to collide with.
@interface CheckoutViewController : UIViewController
@end

// Still prefix if the app embeds its own internal frameworks/modules,
// since those modules become independent link units:
// MyApp/Payments.framework -> PMTPaymentProcessor
// MyApp/Analytics.framework -> ANLEventTracker
```

## See Also

- [`name-protocol-delegate-datasource-suffix`](name-protocol-delegate-datasource-suffix.md) - Suffix callback protocols with `Delegate`/`DataSource`
- [`name-constant-namespaced`](name-constant-namespaced.md) - Namespace exported constants with the owning type's name
- [`name-enum-case-type-prefix`](name-enum-case-type-prefix.md) - Prefix `NS_ENUM` cases with the enclosing type's name
- [`interop-ns-swift-name-rename`](interop-ns-swift-name-rename.md) - Use `NS_SWIFT_NAME` to give Swift an idiomatic name for an Objective-C API
