# null-audited-region-c-api

> Wrap nullability-audited C function regions explicitly

## Why It Matters

`NS_ASSUME_NONNULL_BEGIN`/`END` only affects Objective-C declarations (methods, properties); plain C functions declared in the same header need their own explicit audit via `CF_ASSUME_NONNULL_BEGIN`/`END` (for Core Foundation-style APIs) or explicit `_Nonnull`/`_Nullable` annotations on each pointer parameter. Skipping this leaves a mixed-audit header where the Objective-C surface is fully checked but adjacent C helper functions silently allow `NULL` to flow through unchecked, undermining the header's overall nullability guarantees.

## Bad

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWGeometryHelper : NSObject
- (CGRect)boundingBoxForPoints:(NSArray<NSValue *> *)points;  // Audited: no plain pointers here
@end

NS_ASSUME_NONNULL_END

// This plain C function sits right below the audited region but is NOT
// covered by NS_ASSUME_NONNULL_BEGIN at all - every pointer here is
// nullability-unspecified with no warning from the compiler:
CGPoint OMWMidpointOfPoints(CGPoint *points, NSInteger count);
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWGeometryHelper : NSObject
- (CGRect)boundingBoxForPoints:(NSArray<NSValue *> *)points;
@end

NS_ASSUME_NONNULL_END

// Audit the C function's pointer explicitly, since NS_ASSUME_NONNULL doesn't
// implicitly extend to bare C declarations outside its own region:
CGPoint OMWMidpointOfPoints(CGPoint *_Nonnull points, NSInteger count);
```

## Wrapping a Whole Block of C Functions

```objc
// For a header with many C functions (common in Core Graphics/Core Foundation
// -style APIs), wrap them together rather than annotating each pointer inline:
CF_ASSUME_NONNULL_BEGIN

CGImageRef OMWCreateThumbnail(CGImageRef sourceImage, CGSize targetSize);
CFDataRef OMWCreatePNGData(CGImageRef image);

CF_ASSUME_NONNULL_END
```

## Mixing Nullable Exceptions Inside an Audited C Region

```objc
CF_ASSUME_NONNULL_BEGIN

// Even inside an audited region, an individual parameter that's genuinely
// optional still needs the explicit exception, exactly like the ObjC case:
CGImageRef OMWCreateThumbnailWithFallback(CGImageRef sourceImage,
                                            CGImageRef _Nullable placeholderImage,
                                            CGSize targetSize);

CF_ASSUME_NONNULL_END
```

## See Also

- [`null-assume-nonnull-region`](null-assume-nonnull-region.md) - Wrap headers in `NS_ASSUME_NONNULL_BEGIN`/`END`
- [`arc-bridge-corefoundation`](arc-bridge-corefoundation.md) - Use `__bridge`/`CFBridgingRetain`/`CFBridgingRelease` correctly at CF/ObjC boundaries
- [`null-explicit-nullable`](null-explicit-nullable.md) - Mark exceptions to the nonnull default with `nullable`/`_Nullable`
