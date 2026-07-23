# api-protocol-optional-required

> Mark each protocol method `@optional` or `@required` deliberately

## Why It Matters

Every method in a protocol defaults to `@required` unless explicitly placed after an `@optional` marker, which means an unannotated protocol silently forces every adopter to implement every method — including ones that only make sense in specific configurations. Conversely, marking something `@optional` that the calling code actually depends on turns a missing implementation into a runtime crash (an unrecognized selector, or a silently skipped call) instead of a compile-time error. Getting this split right is what makes `respondsToSelector:` checks meaningful instead of superstitious.

## Bad

```objc
// No @optional/@required markers at all - everything defaults to @required,
// forcing every adopter to implement methods they may not need.
@protocol OMWPlayerDelegate <NSObject>
- (void)player:(OMWPlayer *)player didStartPlayingItem:(OMWMediaItem *)item;
- (void)player:(OMWPlayer *)player didFinishPlayingItem:(OMWMediaItem *)item;
- (void)player:(OMWPlayer *)player didEncounterError:(NSError *)error;
- (void)playerDidBufferForItem:(OMWPlayer *)player;  // Rare/cosmetic event, forced on everyone
@end
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

@protocol OMWPlayerDelegate <NSObject>

@required
// Core lifecycle events every adopter genuinely needs to react to.
- (void)player:(OMWPlayer *)player didStartPlayingItem:(OMWMediaItem *)item;
- (void)player:(OMWPlayer *)player didFinishPlayingItem:(OMWMediaItem *)item;

@optional
// Adopters that don't care about errors or buffering can skip these.
- (void)player:(OMWPlayer *)player didEncounterError:(NSError *)error;
- (void)playerDidBufferForItem:(OMWPlayer *)player;

@end

NS_ASSUME_NONNULL_END

@implementation OMWPlayer

- (void)reportError:(NSError *)error {
    // Always guard @optional methods before calling - this is what makes
    // the @optional/@required split meaningful rather than just documentation.
    if ([self.delegate respondsToSelector:@selector(player:didEncounterError:)]) {
        [self.delegate player:self didEncounterError:error];
    }
}

- (void)notifyStarted:(OMWMediaItem *)item {
    // @required methods can be called unconditionally - the protocol
    // guarantees any conforming type implements them.
    [self.delegate player:self didStartPlayingItem:item];
}

@end
```

## Compiler Enforcement of @required

```objc
// Adopting a protocol without implementing a @required method produces a
// compile-time warning (often escalated to an error via
// GCC_TREAT_WARNINGS_AS_ERRORS), not a silent runtime gap:
@interface OMWLoggingPlayerObserver : NSObject <OMWPlayerDelegate>
@end

@implementation OMWLoggingPlayerObserver
// Missing -player:didFinishPlayingItem: → "Method ... in protocol not implemented"
- (void)player:(OMWPlayer *)player didStartPlayingItem:(OMWMediaItem *)item {
    NSLog(@"Started: %@", item);
}
@end
```

## See Also

- [`api-delegate-protocol-pattern`](api-delegate-protocol-pattern.md) - The delegate pattern this markup supports
- [`api-compose-small-protocols`](api-compose-small-protocols.md) - Splitting protocols instead of over-using `@optional`
- [`name-protocol-delegate-datasource-suffix`](name-protocol-delegate-datasource-suffix.md) - Naming callback protocols
