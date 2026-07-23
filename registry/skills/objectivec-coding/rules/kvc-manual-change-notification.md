# kvc-manual-change-notification

> Call `willChangeValueForKey:`/`didChangeValueForKey:` when hand-rolling KVO

## Why It Matters

Automatic KVO only fires for changes made through a property's synthesized setter. The moment a class mutates its backing ivar directly (bypassing `self.property = ...`), computes a derived value, or exposes a property backed by something other than a simple ivar, KVO observers stop receiving notifications entirely - silently, with no warning or error - unless the class manually brackets the mutation with `willChangeValueForKey:`/`didChangeValueForKey:`.

## Bad

```objc
@interface OMWTemperatureSensor ()
@property (nonatomic, assign) double celsius;
@end

@implementation OMWTemperatureSensor {
    double _fahrenheit; // Derived value, not a simple ivar-backed property.
}

- (double)fahrenheit {
    return _fahrenheit;
}

- (void)sensorDidReadCelsius:(double)celsius {
    self.celsius = celsius;
    _fahrenheit = celsius * 9.0 / 5.0 + 32.0; // Mutates ivar directly.
    // Any observer registered for keyPath "fahrenheit" never fires,
    // because this bypassed the KVO-instrumented setter path entirely.
}

@end
```

## Good

```objc
@interface OMWTemperatureSensor ()
@property (nonatomic, assign) double celsius;
@end

@implementation OMWTemperatureSensor {
    double _fahrenheit;
}

- (double)fahrenheit {
    return _fahrenheit;
}

- (void)sensorDidReadCelsius:(double)celsius {
    self.celsius = celsius;

    [self willChangeValueForKey:@"fahrenheit"];
    _fahrenheit = celsius * 9.0 / 5.0 + 32.0;
    [self didChangeValueForKey:@"fahrenheit"];
}

@end
```

## Declaring Dependent Keys Is Usually Simpler

```objc
// When the derived value is a pure function of another @property,
// +keyPathsForValuesAffectingX is less error-prone than manual
// will/didChangeValueForKey calls, because Foundation fires the
// notification for you whenever the dependency changes.
@interface OMWTemperatureSensor : NSObject
@property (nonatomic, assign) double celsius;
@property (nonatomic, readonly) double fahrenheit;
@end

@implementation OMWTemperatureSensor

+ (NSSet<NSString *> *)keyPathsForValuesAffectingFahrenheit {
    return [NSSet setWithObject:@"celsius"];
}

- (double)fahrenheit {
    return self.celsius * 9.0 / 5.0 + 32.0;
}

@end
// Reserve manual willChange/didChange for cases +keyPathsForValuesAffecting
// can't express, such as a value computed from non-KVO-observable state
// (a C array, a Core Foundation object, or an external file read).
```

## Bracketing Batch Mutations Once

```objc
// For a multi-step mutation, bracket the whole operation once rather
// than firing a notification per intermediate step.
- (void)resetToDefaults {
    [self willChangeValueForKey:@"fahrenheit"];
    _fahrenheit = 32.0;
    self.celsius = 0.0;
    [self didChangeValueForKey:@"fahrenheit"];
}
```

## See Also

- [`kvc-mutable-array-accessor-proxy`](kvc-mutable-array-accessor-proxy.md) - Implement KVC-compliant indexed accessors for to-many relationships
- [`kvc-observe-specific-keypath`](kvc-observe-specific-keypath.md) - Observe specific, well-scoped key paths, not broad wildcard state
- [`perf-avoid-kvo-hot-path`](perf-avoid-kvo-hot-path.md) - Avoid KVO on properties that mutate in tight loops
