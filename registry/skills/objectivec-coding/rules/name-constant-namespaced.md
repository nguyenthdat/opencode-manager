# name-constant-namespaced

> Namespace exported constants with the owning type's name

## Why It Matters

Exported constants live in the same flat global namespace as everything else in Objective-C. A bare constant like `ErrorDomain` or `TimeoutKey` is virtually guaranteed to collide with an identically-named constant in another file, another framework, or a future Apple SDK addition, producing a duplicate-symbol link error that is painful to trace back to its cause. Namespacing every exported constant with the owning type's name (and the framework prefix) removes the ambiguity entirely.

## Bad

```objc
// OMWNetworkClient.h
FOUNDATION_EXPORT NSString *const ErrorDomain;       // Collides with anything else naming this "ErrorDomain"
FOUNDATION_EXPORT NSString *const TimeoutKey;
FOUNDATION_EXPORT NSString *const DefaultTimeout;    // Not even obviously a constant vs. a variable

@interface OMWNetworkClient : NSObject
@end
```

## Good

```objc
// OMWNetworkClient.h
FOUNDATION_EXPORT NSErrorDomain const OMWNetworkClientErrorDomain;
FOUNDATION_EXPORT NSString *const OMWNetworkClientTimeoutUserInfoKey;
FOUNDATION_EXPORT NSTimeInterval const OMWNetworkClientDefaultTimeout;

@interface OMWNetworkClient : NSObject
@end
```

```objc
// OMWNetworkClient.m
NSErrorDomain const OMWNetworkClientErrorDomain = @"OMWNetworkClientErrorDomain";
NSString *const OMWNetworkClientTimeoutUserInfoKey = @"OMWNetworkClientTimeoutUserInfoKey";
NSTimeInterval const OMWNetworkClientDefaultTimeout = 30.0;
```

## Namespacing Notification Names the Same Way

```objc
// Notification constants follow the identical pattern: <Prefix><Type><What>Notification
FOUNDATION_EXPORT NSNotificationName const OMWNetworkClientDidFinishLoadingNotification;
FOUNDATION_EXPORT NSNotificationName const OMWNetworkClientDidFailNotification;
```

## Static Constants Confined to One File Don't Need the Full Prefix

```objc
// OMWNetworkClient.m - file-private, never exported, so a shorter static name is fine
static NSString *const kDefaultUserAgent = @"OMWKit/1.0";
static const NSTimeInterval kRetryBackoffInterval = 2.0;
// Still namespaced enough to avoid confusion within the file, but no linkage risk exists
// since `static` gives it internal linkage.
```

## See Also

- [`name-notification-name-constant`](name-notification-name-constant.md) - Export notification names as `NSNotificationName` constants, not string literals
- [`name-class-prefix-framework`](name-class-prefix-framework.md) - Prefix classes with a 2-3 letter code when shipping a library/framework
- [`anti-stringly-typed-notifications`](anti-stringly-typed-notifications.md) - Don't use raw string literals for notification names/userInfo keys
