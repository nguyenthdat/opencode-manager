# null-generic-mutable-subclass

> Preserve declared generics on mutable collection subclass return types

## Why It Matters

`NSMutableArray`, `NSMutableDictionary`, and `NSMutableSet` are subclasses of their immutable counterparts, and each supports the same `<ObjectType>` generic parameter. If a method or property drops the generic parameter when returning the mutable subclass (or widens it to a bare `NSMutableArray *`), callers lose compile-time element-type checking exactly at the point where mutation (and therefore type mistakes) is most likely to happen.

## Bad

```objc
@interface OMWPlaylistBuilder : NSObject
// Bare NSMutableArray - the compiler can't verify what gets added later
@property (nonatomic, strong, readonly) NSMutableArray *pendingTracks;
@end

@implementation OMWPlaylistBuilder

- (void)stagePlaylist {
    [self.pendingTracks addObject:@"not a track"];  // Compiles fine - no element type to check against
}

@end
```

## Good

```objc
@interface OMWPlaylistBuilder : NSObject
@property (nonatomic, strong, readonly) NSMutableArray<OMWTrack *> *pendingTracks;  // Generic preserved
@end

@implementation OMWPlaylistBuilder

- (void)stagePlaylist {
    [self.pendingTracks addObject:@"not a track"];
    // Warning: incompatible pointer types sending 'NSString *' to parameter
    // of type 'OMWTrack *' - caught before it ever reaches a mutable array
    // some other code assumed only ever holds OMWTrack instances.
}

@end
```

## Returning a Mutable Copy Keeps the Generic Too

```objc
- (NSMutableArray<OMWTrack *> *)mutableCopyOfTracks {
    // -mutableCopy returns id by default; recast through the generic type so
    // callers keep compiler-checked element types on the mutable result:
    return [(NSArray<OMWTrack *> *)self.tracks mutableCopy];
}
```

## Internal Storage Should Match the Public Generic

```objc
@interface OMWPlaylistBuilder ()
// Keep the private backing ivar's generic in sync with the public accessor's
// generic - a mismatch here is a common source of silent type confusion:
@property (nonatomic, strong) NSMutableArray<OMWTrack *> *mutablePendingTracks;
@end
```

## See Also

- [`null-lightweight-generics`](null-lightweight-generics.md) - Parameterize collections with lightweight generics (`NSArray<NSString *> *`)
- [`null-kindof-covariant-return`](null-kindof-covariant-return.md) - Use `__kindof` for covariant factory/collection return types
- [`anti-mutable-public-property`](anti-mutable-public-property.md) - Don't expose a mutable (`NSMutableArray *`) property directly on a public interface
