# name-no-get-prefix-getter

> Don't prefix simple getters with `get`

## Why It Matters

In Cocoa, a leading `get` is reserved for a specific pattern: a method that fills an out-parameter passed by reference (e.g. `-getLine:range:`), not a plain value-returning accessor. Naming an ordinary getter `getFoo` collides with that convention, confuses readers into expecting an out-parameter, and produces an awkward Swift import (`getFoo()` instead of the property-like `foo`).

## Bad

```objc
@interface OMWUser : NSObject

- (NSString *)getName;              // Plain getter, should not have "get"
- (NSInteger)getAge;
- (NSArray<OMWOrder *> *)getOrders;

@end
```

## Good

```objc
@interface OMWUser : NSObject

@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, assign, readonly) NSInteger age;
@property (nonatomic, strong, readonly) NSArray<OMWOrder *> *orders;

@end
```

## The Actual Meaning of `get` in Cocoa

```objc
// "get" is correct here because it fills caller-provided out-parameters by reference -
// it isn't simply returning a value.
- (void)getLineStart:(NSUInteger *)startIndex
                 end:(NSUInteger *)endIndex
         contentsEnd:(NSUInteger *)contentsEndIndex
            forRange:(NSRange)range;

- (BOOL)getBytes:(void *)buffer length:(NSUInteger)length;  // NSData's real API

// A custom API following the same real pattern is fine to prefix with "get":
- (void)getRed:(CGFloat *)red
          green:(CGFloat *)green
           blue:(CGFloat *)blue
          alpha:(CGFloat *)alpha;
```

## Prefer a Property Over a Bare Getter Method

```objc
// Even a getter with zero side effects and no arguments should usually be a property,
// not a manually declared method - it documents intent and enables dot-syntax/KVC.
@interface OMWNetworkClient : NSObject
@property (nonatomic, strong, readonly) NSURL *baseURL;   // preferred
- (NSURL *)baseURL;                                        // equivalent but less idiomatic
@end
```

## See Also

- [`name-is-has-boolean-accessor`](name-is-has-boolean-accessor.md) - Prefix Boolean accessors with `is`/`has`/`can`/`should`
- [`name-verbose-descriptive`](name-verbose-descriptive.md) - Prefer verbose, descriptive names over cryptic abbreviations
- [`api-property-attribute-discipline`](api-property-attribute-discipline.md) - Choose `atomic`/`nonatomic`, `strong`/`copy`/`weak`, `readonly`/`readwrite` deliberately
