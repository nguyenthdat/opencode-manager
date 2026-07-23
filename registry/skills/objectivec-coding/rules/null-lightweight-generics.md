# null-lightweight-generics

> Parameterize collections with lightweight generics (`NSArray<NSString *> *`)

## Why It Matters

Bare `NSArray *`/`NSDictionary *`/`NSSet *` give the compiler no information about element types, so passing the wrong kind of object into a collection, or force-casting an element that turns out to be something else, is only caught at runtime with a crash. Lightweight generics let the compiler warn at the call site, and they change how the collection bridges to Swift: `NSArray<NSString *> *` imports as `[String]`, while bare `NSArray *` imports as `[Any]`, forcing awkward casts on the Swift side.

## Bad

```objc
@interface OMWPlaylist : NSObject
@property (nonatomic, copy) NSArray *trackTitles;               // Element type unknown to the compiler
@property (nonatomic, copy) NSDictionary *metadataByKey;         // Key/value types unknown
@end

- (void)printTitles:(OMWPlaylist *)playlist {
    for (NSString *title in playlist.trackTitles) {   // Compiler can't verify these are actually NSString
        NSLog(@"%@", [title uppercaseString]);        // Crashes at runtime if a non-string snuck in
    }
}
```

## Good

```objc
@interface OMWPlaylist : NSObject
@property (nonatomic, copy) NSArray<NSString *> *trackTitles;                 // Compiler-checked element type
@property (nonatomic, copy) NSDictionary<NSString *, NSNumber *> *metadataByKey;  // Compiler-checked key/value
@end

- (void)printTitles:(OMWPlaylist *)playlist {
    for (NSString *title in playlist.trackTitles) {   // Compiler enforces NSString elements at assignment sites
        NSLog(@"%@", [title uppercaseString]);
    }
}
```

## Covariance With `__kindof`

```objc
// Lightweight generics are invariant by default, so a method returning
// NSArray<OMWTrack *> * can't be assigned to NSArray<OMWAudioTrack *> * even
// if OMWAudioTrack is a subclass. Use __kindof when the actual runtime type
// varies within a known base class - see null-kindof-covariant-return.
@property (nonatomic, copy, readonly) NSArray<__kindof OMWTrack *> *tracks;
```

## Custom Generic Classes

```objc
// Declare your own generic containers the same way Foundation does:
@interface OMWBox<ObjectType> : NSObject
@property (nonatomic, strong, readonly) ObjectType value;
- (instancetype)initWithValue:(ObjectType)value;
@end

OMWBox<NSString *> *nameBox = [[OMWBox alloc] initWithValue:@"Ada"];
NSString *name = nameBox.value;  // Typed as NSString*, not id, at the call site
```

## See Also

- [`null-kindof-covariant-return`](null-kindof-covariant-return.md) - Use `__kindof` for covariant factory/collection return types
- [`null-generic-mutable-subclass`](null-generic-mutable-subclass.md) - Preserve declared generics on mutable collection subclass return types
- [`interop-generics-bridge-to-swift`](interop-generics-bridge-to-swift.md) - Use lightweight generics so collections bridge to typed Swift arrays/dictionaries
