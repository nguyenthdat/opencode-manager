# arc-strong-default-ownership

> Default object properties to `strong` unless a specific ownership qualifier is needed

## Why It Matters

Omitting an explicit ownership qualifier on an object property leaves the intent ambiguous to readers, even though the compiler defaults to `strong`. Worse, forgetting the qualifier on a property that actually needs `weak` (a delegate, a parent back-reference) silently creates a retain cycle rather than failing to compile, because `strong` is a legal, unremarkable default. Being explicit about `strong` signals "this object genuinely owns its value" and makes the exceptions (`weak`, `copy`, `unsafe_unretained`) stand out during review.

## Bad

```objc
@interface OMWPlaylist : NSObject
@property NSString *name;                 // No qualifier: is this strong? copy? Ambiguous to readers.
@property OMWPlaylistDelegate *delegate;   // No qualifier: this should almost certainly be weak!
@property NSArray<OMWTrack *> *tracks;     // No qualifier: strong by default, but not stated
@end
```

## Good

```objc
@interface OMWPlaylist : NSObject
@property (nonatomic, copy) NSString *name;                       // Explicit: value semantics
@property (nonatomic, weak) id<OMWPlaylistDelegate> delegate;      // Explicit: avoids owner cycle
@property (nonatomic, strong) NSArray<OMWTrack *> *tracks;         // Wait - should be copy too, see below
@end

// Corrected: NSArray is a value-like Foundation type, so copy is more correct
// than strong here (see arc-copy-value-objects). The point of this rule is
// that every property states its ownership explicitly so the choice is a
// deliberate decision, not an accident of the compiler's default.
@interface OMWPlaylist ()
@property (nonatomic, copy) NSArray<OMWTrack *> *tracks;
@end
```

## Model Objects: `strong` Is the Right Explicit Choice

```objc
@interface OMWTrack : NSObject
@property (nonatomic, strong) OMWAlbum *album;       // Genuine ownership, not a value type
@property (nonatomic, strong) AVPlayerItem *playerItem;  // Identity matters; strong is correct and explicit
@end
```

## Ivars Without `@property` Still Need Explicit Qualifiers

```objc
@interface OMWCache : NSObject {
    __strong NSMutableDictionary *_storage;   // Explicit even for a plain ivar
    __weak id<OMWCacheDelegate> _delegate;    // Explicit even for a plain ivar
}
@end
```

## See Also

- [`arc-copy-value-objects`](arc-copy-value-objects.md) - Use `copy` (not `strong`) for `NSString`/`NSArray`/`NSDictionary` properties
- [`arc-weak-delegate`](arc-weak-delegate.md) - Declare delegate properties `weak` to avoid owner retain cycles
- [`api-property-attribute-discipline`](api-property-attribute-discipline.md) - Choose `atomic`/`nonatomic`, `strong`/`copy`/`weak`, `readonly`/`readwrite` deliberately
