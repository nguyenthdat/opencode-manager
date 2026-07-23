# arc-copy-value-objects

> Use `copy` (not `strong`) for `NSString`/`NSArray`/`NSDictionary` properties

## Why It Matters

`NSString`, `NSArray`, and `NSDictionary` all have mutable subclasses (`NSMutableString`, `NSMutableArray`, `NSMutableDictionary`). If a property is declared `strong`, a caller can pass a mutable instance and continue mutating it out from under you after assignment, silently corrupting state you assumed was immutable. `copy` takes an immutable snapshot at assignment time (and is nearly free if the caller already passed an immutable instance, since `-copy` on an immutable object just retains).

## Bad

```objc
@interface OMWUser : NSObject
@property (nonatomic, strong) NSString *displayName;   // Caller-owned mutable string can change later
@property (nonatomic, strong) NSArray<NSString *> *tags; // Caller-owned mutable array can change later
@end

// Elsewhere:
NSMutableString *name = [NSMutableString stringWithString:@"Ada"];
NSMutableArray<NSString *> *tags = [NSMutableArray arrayWithObjects:@"admin", nil];

OMWUser *user = [[OMWUser alloc] init];
user.displayName = name;
user.tags = tags;

[name appendString:@" Lovelace"];  // Mutates user.displayName too - it's the same object!
[tags addObject:@"superuser"];    // Mutates user.tags too - unexpected extra tag appears
```

## Good

```objc
@interface OMWUser : NSObject
@property (nonatomic, copy) NSString *displayName;    // Immutable snapshot taken at assignment
@property (nonatomic, copy) NSArray<NSString *> *tags; // Immutable snapshot taken at assignment
@end

// Elsewhere:
NSMutableString *name = [NSMutableString stringWithString:@"Ada"];
NSMutableArray<NSString *> *tags = [NSMutableArray arrayWithObjects:@"admin", nil];

OMWUser *user = [[OMWUser alloc] init];
user.displayName = name;  // Copies into an immutable NSString
user.tags = tags;         // Copies into an immutable NSArray

[name appendString:@" Lovelace"];  // user.displayName is unaffected
[tags addObject:@"superuser"];    // user.tags is unaffected
```

## Custom Setter Equivalent

```objc
// If you implement the setter manually instead of using @property copy,
// you must call -copy yourself:
- (void)setDisplayName:(NSString *)displayName {
    _displayName = [displayName copy];  // Do this, not `_displayName = displayName;`
}
```

## When `strong` Is Still Correct

```objc
// Genuinely mutable collection properties that are meant to be mutated by
// callers in place (rare, and usually discouraged - see anti-mutable-public-property)
// or non-value types (view controllers, sockets, model objects with identity)
// should stay `strong`. Only value-like, copyable Foundation types need `copy`.
@property (nonatomic, strong) OMWNetworkClient *networkClient;  // Identity matters, not value
```

## See Also

- [`arc-copy-block-property`](arc-copy-block-property.md) - Use `copy` for block-typed properties
- [`arc-strong-default-ownership`](arc-strong-default-ownership.md) - Default object properties to `strong` unless a specific ownership qualifier is needed
- [`anti-mutable-public-property`](anti-mutable-public-property.md) - Don't expose a mutable (`NSMutableArray *`) property directly on a public interface
- [`null-lightweight-generics`](null-lightweight-generics.md) - Parameterize collections with lightweight generics
