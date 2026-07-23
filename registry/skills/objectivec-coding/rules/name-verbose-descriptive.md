# name-verbose-descriptive

> Prefer verbose, descriptive names over cryptic abbreviations

## Why It Matters

Objective-C has no lightweight namespacing and a long tradition of self-documenting Cocoa APIs (`numberOfRowsInSection:`, not `nRows:`). Abbreviated names save a few keystrokes but cost every future reader (and every Swift caller reading the bridged signature) time spent guessing what `calcTtl:` or `usrMgr` actually means. Xcode's autocomplete makes verbosity essentially free, so there is no performance argument for staying cryptic.

## Bad

```objc
@interface OMWCartCalc : NSObject

- (double)calcTtl:(NSArray *)itms disc:(double)d;  // "Ttl", "itms", "disc", "d" all require guessing
- (void)procOrd:(OMWOrd *)o;                         // Abbreviated type and parameter name

@property (nonatomic, strong) NSArray *usrs;         // Plural of an unclear abbreviation
@property (nonatomic, assign) NSInteger cnt;         // Count of what?

@end
```

## Good

```objc
@interface OMWCartCalculator : NSObject

- (double)calculateTotalForItems:(NSArray<OMWCartItem *> *)items
                       discount:(double)discountPercentage;
- (void)processOrder:(OMWOrder *)order;

@property (nonatomic, strong) NSArray<OMWUser *> *registeredUsers;
@property (nonatomic, assign) NSInteger pendingOrderCount;

@end
```

## Common Abbreviations Still Worth Keeping

A handful of abbreviations are so entrenched in Cocoa itself that spelling them out would be *less* idiomatic, not more:

```objc
// These read naturally to any Cocoa developer - keep them
@property (nonatomic, copy) NSString *urlString;     // URL, not "uniformResourceLocator"
@property (nonatomic, assign) CGRect frame;          // Standard Core Graphics type
- (instancetype)initWithMinX:(CGFloat)minX minY:(CGFloat)minY;

// Contrast with project-specific jargon, which should always be spelled out
@property (nonatomic, assign) NSInteger maxRetryCount; // Clear even fully spelled out
```

## When Short Local Variables Are Fine

```objc
// Tight, obviously-scoped loop variables are fine - the scope IS the documentation
for (NSUInteger i = 0; i < array.count; i++) {
    OMWUser *user = array[i];
    [self processUser:user];
}

// Fine in a one-line block where the type makes the meaning obvious
[users sortUsingComparator:^NSComparisonResult(OMWUser *a, OMWUser *b) {
    return [a.lastName compare:b.lastName];
}];
```

## See Also

- [`name-camelcase-convention`](name-camelcase-convention.md) - Use `lowerCamelCase` for methods/properties, `UpperCamelCase` for types/protocols
- [`name-no-get-prefix-getter`](name-no-get-prefix-getter.md) - Don't prefix simple getters with `get`
- [`name-multi-keyword-selector-clarity`](name-multi-keyword-selector-clarity.md) - Break multi-argument selectors into clearly labeled keyword segments
- [`doc-headerdoc-comment-style`](doc-headerdoc-comment-style.md) - Document public API with HeaderDoc-style `/** ... */` comments
