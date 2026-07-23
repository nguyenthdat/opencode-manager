# api-class-extension-private-api

> Hide private properties/methods in a class-extension (anonymous category)

## Why It Matters

Anything declared in a public `.h` header is part of your API contract forever — every property and method there is visible to every importer, including Swift callers, and removing or changing it later is a breaking change. A class extension (`@interface OMWFoo ()` with no name, declared in the `.m` file) lets a class have private ivars, properties, and method declarations that are fully usable inside the implementation but completely invisible to anything that only sees the public header.

## Bad

```objc
// OMWImageCache.h - internal bookkeeping leaked into the public header
NS_ASSUME_NONNULL_BEGIN

@interface OMWImageCache : NSObject

@property (nonatomic, strong) NSCache<NSString *, UIImage *> *backingCache;  // Implementation detail, publicly settable
@property (nonatomic, strong) dispatch_queue_t internalQueue;  // Callers could reach in and misuse this

- (nullable UIImage *)imageForKey:(NSString *)key;
- (void)evictExpiredEntries;  // Not meant to be called externally

@end

NS_ASSUME_NONNULL_END
```

## Good

```objc
// OMWImageCache.h - only the real public surface
NS_ASSUME_NONNULL_BEGIN

@interface OMWImageCache : NSObject

- (nullable UIImage *)imageForKey:(NSString *)key;
- (void)storeImage:(UIImage *)image forKey:(NSString *)key;

@end

NS_ASSUME_NONNULL_END

// OMWImageCache.m - class extension holds everything private
@interface OMWImageCache ()

@property (nonatomic, strong) NSCache<NSString *, UIImage *> *backingCache;
@property (nonatomic, strong) dispatch_queue_t internalQueue;

- (void)evictExpiredEntries;

@end

@implementation OMWImageCache

- (instancetype)init {
    self = [super init];
    if (self) {
        _backingCache = [[NSCache alloc] init];
        _internalQueue = dispatch_queue_create("com.opswat.mywidget.imagecache", DISPATCH_QUEUE_SERIAL);
    }
    return self;
}

- (nullable UIImage *)imageForKey:(NSString *)key {
    return [self.backingCache objectForKey:key];
}

- (void)storeImage:(UIImage *)image forKey:(NSString *)key {
    [self.backingCache setObject:image forKey:key];
    [self evictExpiredEntries];  // Private helper, fully usable within the implementation
}

- (void)evictExpiredEntries {
    // Not visible or callable from outside this file
}

@end
```

## Class Extension vs. Named Category

```objc
// A class extension (anonymous category, must be in the SAME compilation
// unit as @implementation) can:
//   - add ivars
//   - redeclare an inherited readonly property as readwrite (see api-readonly-public-readwrite-private)
//   - require the class to implement every declared method
//
// A named category (e.g. `@interface OMWImageCache (Serialization)`) cannot
// add ivars and does not require the implementation to be in the same file -
// use it for genuinely separable, optional functionality instead.
```

## See Also

- [`api-readonly-public-readwrite-private`](api-readonly-public-readwrite-private.md) - The most common class-extension use case
- [`proj-private-headers-separate`](proj-private-headers-separate.md) - Keeping private headers out of a public framework
- [`api-category-extend-not-override`](api-category-extend-not-override.md) - How named categories differ and where their limits are
