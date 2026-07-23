# anti-singleton-overuse

> Don't reach for a singleton as the default access pattern

## Why It Matters

A singleton is global mutable state with an object-oriented costume. Every class that reaches for `[OMWSessionManager sharedInstance]` instead of receiving a session manager through its initializer creates a hidden dependency that doesn't show up in the class's interface, can't be swapped for a test double without global-state hacks, and forces every test in the whole suite to worry about singleton state leaking between test cases. Overused, singletons make it impossible to run two independent instances of your app's logic (e.g. two accounts, or a background extension) in the same process.

## Bad

```objc
@interface OMWSessionManager : NSObject
+ (instancetype)sharedInstance;
@property (nonatomic, strong) OMWUser *currentUser;
@end

@implementation OMWSessionManager
+ (instancetype)sharedInstance {
    static OMWSessionManager *instance;
    static dispatch_once_t onceToken;
    dispatch_once(^{
        instance = [[self alloc] init];
    });
    return instance;
}
@end
```

```objc
// Every consumer reaches straight into the global singleton, so
// nothing in this class's public interface reveals that it depends
// on session state at all.
@implementation OMWOrderSubmitter

- (void)submitOrder:(OMWOrder *)order {
    OMWUser *user = [OMWSessionManager sharedInstance].currentUser;   // Hidden
                                                                        // dependency.
    if (user == nil) {
        return;
    }
    [self.networkClient postOrder:order forUser:user];
}

@end
```

## Good

```objc
// The dependency is explicit in the initializer, so a test can inject
// a fake session provider, and two independent OMWOrderSubmitter
// instances can use two entirely different session sources.
@protocol OMWSessionProviding <NSObject>
@property (nonatomic, strong, readonly, nullable) OMWUser *currentUser;
@end

@interface OMWOrderSubmitter : NSObject
- (instancetype)initWithSessionProvider:(id<OMWSessionProviding>)sessionProvider
                            networkClient:(OMWNetworkClient *)networkClient
    NS_DESIGNATED_INITIALIZER;
@end

@implementation OMWOrderSubmitter

- (void)submitOrder:(OMWOrder *)order {
    OMWUser *user = self.sessionProvider.currentUser;
    if (user == nil) {
        return;
    }
    [self.networkClient postOrder:order forUser:user];
}

@end
```

## When a Singleton Genuinely Fits

```objc
// A small number of Cocoa-provided facilities are legitimately
// process-wide by nature (there is exactly one keyboard, one
// application delegate, one default file manager) and Apple models
// them as singletons for that reason:
[NSFileManager defaultManager];
[UIApplication sharedApplication];
[NSNotificationCenter defaultCenter];
// Model your own singleton this way only when the resource it
// represents is truly one-per-process, not merely "convenient to
// reach from anywhere."
```

## See Also

- [`conc-dispatch-once-singleton`](conc-dispatch-once-singleton.md) - Use `dispatch_once` for thread-safe singleton/lazy initialization
- [`test-protocol-injection-for-mocking`](test-protocol-injection-for-mocking.md) - Depend on protocols, not concrete classes, to enable test doubles
- [`api-single-responsibility-class`](api-single-responsibility-class.md) - Keep each class focused on one responsibility
