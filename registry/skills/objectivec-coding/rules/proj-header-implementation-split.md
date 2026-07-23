# proj-header-implementation-split

> Split public interface (`.h`) from implementation (`.m`)

## Why It Matters

Objective-C's compilation model relies on the header declaring the contract other files can `#import` without pulling in implementation details. Mixing declaration and implementation in one file (or declaring everything in the `.m` with no `.h`) forces every caller to see private ivars and method bodies, breaks incremental compilation (any private change forces a full rebuild of every importer), and makes it impossible to hide implementation details from consumers or from Swift.

## Bad

```objc
// OMWTemperatureConverter.m
// No corresponding header at all -- nothing else can import this cleanly.
#import <Foundation/Foundation.h>

@interface OMWTemperatureConverter : NSObject
// Interface declared inside the .m file: any other .m that wants to use
// this class must #import "OMWTemperatureConverter.m" itself, dragging in
// the entire implementation and its private imports.
@property (nonatomic, assign) double calibrationOffset;
- (double)celsiusFromFahrenheit:(double)fahrenheit;
@end

@implementation OMWTemperatureConverter

- (double)celsiusFromFahrenheit:(double)fahrenheit {
    return (fahrenheit - 32.0) * 5.0 / 9.0 + self.calibrationOffset;
}

@end
```

## Good

```objc
// OMWTemperatureConverter.h
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface OMWTemperatureConverter : NSObject

@property (nonatomic, assign) double calibrationOffset;

- (double)celsiusFromFahrenheit:(double)fahrenheit;

@end

NS_ASSUME_NONNULL_END
```

```objc
// OMWTemperatureConverter.m
#import "OMWTemperatureConverter.h"

@implementation OMWTemperatureConverter

- (double)celsiusFromFahrenheit:(double)fahrenheit {
    return (fahrenheit - 32.0) * 5.0 / 9.0 + self.calibrationOffset;
}

@end
```

## Private State Still Belongs in the Implementation

```objc
// OMWTemperatureConverter.m
#import "OMWTemperatureConverter.h"

// A class extension in the .m keeps private state out of the public
// header entirely, while still splitting interface from implementation.
@interface OMWTemperatureConverter ()
@property (nonatomic, strong) NSDateFormatter *cachedFormatter;
@end

@implementation OMWTemperatureConverter

- (double)celsiusFromFahrenheit:(double)fahrenheit {
    return (fahrenheit - 32.0) * 5.0 / 9.0 + self.calibrationOffset;
}

@end
```

## When a Header-Only File Is Acceptable

A pure C constants/typedefs header with no corresponding `.m` (e.g. `OMWErrorCodes.h` holding only an `NS_ERROR_ENUM`) is fine, since there's no implementation to split out. The rule targets classes and categories, which always have behavior that belongs in an implementation file.

## See Also

- [`proj-one-class-per-file`](proj-one-class-per-file.md) - Keep one primary class per file, named to match
- [`proj-private-headers-separate`](proj-private-headers-separate.md) - Keep private/internal headers out of the public framework header directory
- [`api-class-extension-private-api`](api-class-extension-private-api.md) - Hide private properties/methods in a class-extension (anonymous category)
- [`proj-import-vs-forward-declare`](proj-import-vs-forward-declare.md) - Forward-declare with `@class`/`@protocol` in headers; `#import` in implementation files
