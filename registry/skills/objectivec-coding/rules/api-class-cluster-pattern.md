# api-class-cluster-pattern

> Implement class clusters with an abstract superclass and private concrete subclasses

## Why It Matters

A class cluster (the pattern behind `NSNumber`, `NSString`, and `NSArray`) lets you expose one simple public interface while freely swapping optimized concrete implementations behind it — a small integer, a tagged pointer, or a heap-backed storage variant — without callers ever needing to know or care. Exposing the concrete subclasses directly instead locks callers to a specific implementation, and it becomes a source-breaking change to ever restructure storage internally.

## Bad

```objc
// Callers are exposed directly to concrete storage subclasses
@interface OMWSmallByteBuffer : NSObject
@property (nonatomic, readonly) NSUInteger length;
@end

@interface OMWLargeByteBuffer : NSObject
@property (nonatomic, readonly) NSUInteger length;
@end

// Caller has to decide which concrete class to allocate, and switching
// strategy later means changing every call site.
OMWSmallByteBuffer *small = [[OMWSmallByteBuffer alloc] init];
```

## Good

```objc
// OMWByteBuffer.h - abstract public interface
NS_ASSUME_NONNULL_BEGIN

@interface OMWByteBuffer : NSObject

@property (nonatomic, readonly) NSUInteger length;

+ (instancetype)bufferWithCapacity:(NSUInteger)capacity;  // Picks the concrete subclass internally
- (void)appendBytes:(const void *)bytes length:(NSUInteger)length;

@end

NS_ASSUME_NONNULL_END

// OMWByteBuffer.m - private concrete subclasses, never exposed in a public header
@interface OMWSmallByteBuffer : OMWByteBuffer
@end

@interface OMWLargeByteBuffer : OMWByteBuffer
@end

@implementation OMWByteBuffer

+ (instancetype)bufferWithCapacity:(NSUInteger)capacity {
    if (capacity <= 64) {
        return [[OMWSmallByteBuffer alloc] initPrivateWithCapacity:capacity];  // Inline storage, no heap alloc
    }
    return [[OMWLargeByteBuffer alloc] initPrivateWithCapacity:capacity];  // Heap-backed growable storage
}

- (void)appendBytes:(const void *)bytes length:(NSUInteger)length {
    NSAssert(NO, @"Subclasses of OMWByteBuffer must override -appendBytes:length:");
}

@end

@implementation OMWSmallByteBuffer {
    uint8_t _inlineStorage[64];
    NSUInteger _length;
}
- (void)appendBytes:(const void *)bytes length:(NSUInteger)length {
    memcpy(_inlineStorage + _length, bytes, length);
    _length += length;
}
@end
```

## Caller's-Eye View

```objc
// Callers never see, name, or `isKindOfClass:`-check the concrete subclasses -
// they only ever see and use OMWByteBuffer, exactly like NSNumber hides
// __NSCFNumber/NSTaggedPointerNumber from its callers.
OMWByteBuffer *buffer = [OMWByteBuffer bufferWithCapacity:16];
[buffer appendBytes:someBytes length:16];
NSLog(@"%@", NSStringFromClass([buffer class]));  // "OMWSmallByteBuffer" - an implementation detail
```

## See Also

- [`api-class-extension-private-api`](api-class-extension-private-api.md) - Hiding the private concrete subclasses' extra API
- [`api-abstract-base-assert`](api-abstract-base-assert.md) - Enforcing the abstract superclass's contract
- [`null-kindof-covariant-return`](null-kindof-covariant-return.md) - Typing factory return values that may vary by subclass
