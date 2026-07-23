# kvc-mutable-array-accessor-proxy

> Implement KVC-compliant indexed accessors for to-many relationships

## Why It Matters

Exposing a to-many relationship as a plain `NSArray` property forces every caller who wants to mutate it to replace the entire array (`self.items = newArray`), which is wasteful and defeats fine-grained KVO change notifications (`NSKeyValueChangeInsertion`/`Removal` at specific indexes). Implementing the KVC indexed-accessor pattern (`countOfX`, `objectInXAtIndex:`, `insertObject:inXAtIndex:`, `removeObjectFromXAtIndex:`) lets `[foo mutableArrayValueForKey:@"items"]` provide a real mutable proxy with correct, granular KVO notifications, and it's what Cocoa Bindings and `NSArrayController` expect.

## Bad

```objc
@interface OMWPlaylist : NSObject
@property (nonatomic, copy) NSArray<OMWTrack *> *tracks;
@end

- (void)addTrack:(OMWTrack *)track {
    // Rebuilds and replaces the entire array for a single insertion -
    // O(n) copy, and KVO observers see a wholesale "replaced" change
    // instead of a precise insertion at one index.
    self.tracks = [self.tracks arrayByAddingObject:track];
}
```

## Good

```objc
@interface OMWPlaylist ()
@property (nonatomic, strong) NSMutableArray<OMWTrack *> *internalTracks;
@end

@implementation OMWPlaylist

- (NSUInteger)countOfTracks {
    return self.internalTracks.count;
}

- (OMWTrack *)objectInTracksAtIndex:(NSUInteger)index {
    return self.internalTracks[index];
}

- (void)insertObject:(OMWTrack *)track inTracksAtIndex:(NSUInteger)index {
    // KVO-compliant: Foundation wraps this call with the correct
    // willChange/didChange insertion notifications automatically.
    [self.internalTracks insertObject:track atIndex:index];
}

- (void)removeObjectFromTracksAtIndex:(NSUInteger)index {
    [self.internalTracks removeObjectAtIndex:index];
}

@end

// Callers use the KVC proxy for granular, efficient mutation:
NSMutableArray<OMWTrack *> *proxy = [playlist mutableArrayValueForKey:@"tracks"];
[proxy addObject:newTrack];      // Fires an insertion notification, not a replace.
[proxy removeObjectAtIndex:0];   // Fires a removal notification.
```

## Exposing a Read-Only Immutable Snapshot Alongside

```objc
// Keep a plain, read-only NSArray property for simple enumeration,
// backed by the same storage, so most callers don't need to know
// about the KVC indexed-accessor machinery at all.
- (NSArray<OMWTrack *> *)tracks {
    return [self.internalTracks copy];
}
```

## See Also

- [`kvc-manual-change-notification`](kvc-manual-change-notification.md) - Call `willChangeValueForKey:`/`didChangeValueForKey:` when hand-rolling KVO
- [`anti-mutable-public-property`](anti-mutable-public-property.md) - Don't expose a mutable (`NSMutableArray *`) property directly on a public interface
- [`api-readonly-public-readwrite-private`](api-readonly-public-readwrite-private.md) - Expose `readonly` publicly, redeclare `readwrite` in a private extension
