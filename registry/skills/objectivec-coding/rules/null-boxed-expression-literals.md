# null-boxed-expression-literals

> Use boxed expressions (`@(x)`, `@[]`, `@{}`) instead of manual wrapper calls

## Why It Matters

Manually calling `[NSNumber numberWithInt:]`, `[NSArray arrayWithObjects:...]`, or `[NSDictionary dictionaryWithObjectsAndKeys:...]` is verbose, requires a trailing `nil` sentinel that's easy to forget (leading to a crash or silent truncation), and doesn't read as clearly as the literal syntax. Boxed expressions and collection literals are shorter, can't accidentally omit the `nil` terminator, and are how Apple's own modern headers and sample code are written since Xcode 4.4+/Objective-C literals shipped.

## Bad

```objc
NSNumber *count = [NSNumber numberWithInteger:self.items.count];
NSNumber *isEnabled = [NSNumber numberWithBool:YES];

NSArray *colors = [NSArray arrayWithObjects:@"red", @"green", @"blue", nil];  // Forgetting nil crashes/truncates

NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:
                          @"Ada", @"name",
                          [NSNumber numberWithInteger:36], @"age",
                          nil];  // Verbose, alternating key/value order is error-prone
```

## Good

```objc
NSNumber *count = @(self.items.count);
NSNumber *isEnabled = @YES;

NSArray<NSString *> *colors = @[@"red", @"green", @"blue"];  // No sentinel needed; trailing nil is a compile error

NSDictionary<NSString *, id> *userInfo = @{
    @"name": @"Ada",
    @"age": @36,
};  // Reads as key: value, matches the literal's actual shape
```

## Boxing Expressions, Not Just Literal Constants

```objc
// @() boxes any scalar C expression, not just a literal value:
NSInteger rawCount = [self computeRawCount];
NSNumber *boxed = @(rawCount);              // Boxes a variable
NSNumber *boxedMath = @(rawCount * 2 + 1);  // Boxes an arbitrary expression
NSNumber *boxedEnum = @(OMWStatusActive);   // Boxes an NS_ENUM value as its underlying integer
```

## A `nil` Value in a Literal Is a Compile-Time-Detectable Crash Risk

```objc
// Both the old and new syntaxes crash on a nil element/value at runtime, but
// literals make the failure mode more obvious to spot in review since there's
// no sentinel to accidentally miscount:
NSString *maybeNilName = [self fetchOptionalName];  // Could be nil
// NSDictionary *info = @{@"name": maybeNilName};  // Crashes if maybeNilName is nil - guard first:
NSDictionary *info = maybeNilName != nil ? @{@"name": maybeNilName} : @{};
```

## See Also

- [`null-avoid-nsnull-sentinel-sprawl`](null-avoid-nsnull-sentinel-sprawl.md) - Centralize `NSNull` sentinel handling instead of scattering checks
- [`kvc-dictionary-literal-nil-guard`](kvc-dictionary-literal-nil-guard.md) - Guard against `nil` values before building `@{}` dictionary literals
- [`anti-nsnumber-primitive-obsession`](anti-nsnumber-primitive-obsession.md) - Don't stringify/box everything into `NSNumber`/`NSString` instead of real types
