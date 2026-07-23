# proj-pch-minimal

> Keep the precompiled prefix header minimal; avoid dumping every import into it

## Why It Matters

Every symbol imported into the prefix header (`.pch`) is silently visible in every single file in the target, whether that file needs it or not. This hides real dependencies (a file compiles only because the `.pch` happens to import something it needs, not because it declared that dependency itself), and it means any change to the `.pch` forces Clang to recompute and potentially invalidate the precompiled header for the entire target, defeating the build-time benefit the `.pch` exists to provide.

## Bad

```objc
// OMWStore-Prefix.pch
#ifdef __OBJC__
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <CoreData/CoreData.h>
#import <MapKit/MapKit.h>
#import <AVFoundation/AVFoundation.h>
#import "OMWNetworkClient.h"     // A specific class, not a system framework!
#import "OMWConstants.h"
#import "OMWLogger.h"
#import "NSString+OMWFormatting.h"
// Now every .m file in the target implicitly has MapKit and AVFoundation
// visible even if it never uses either -- and nobody can tell, from
// reading a given file, which of its dependencies come from its own
// #import list versus from this hidden global injection point.
#endif
```

## Good

```objc
// OMWStore-Prefix.pch -- only the frameworks nearly every file needs,
// and only system frameworks, never project-specific headers.
#ifdef __OBJC__
#import <Foundation/Foundation.h>
#endif
```

```objc
// OMWMapAnnotationView.m -- imports MapKit explicitly because it
// actually uses it; the dependency is visible right where it's used.
#import "OMWMapAnnotationView.h"
#import <MapKit/MapKit.h>

@implementation OMWMapAnnotationView
// ...
@end
```

## Modern Alternative: Skip the .pch Entirely

```
// Recent Xcode/Swift-heavy targets often disable the shared prefix
// header altogether and rely on per-file #import plus module caching:
GCC_PREFIX_HEADER =
CLANG_ENABLE_MODULES = YES
// With Clang modules enabled, `#import <Foundation/Foundation.h>` is
// itself effectively precompiled and shared across the build, so a
// manual .pch buys little while still hiding dependencies.
```

## See Also

- [`anti-import-everything-header`](anti-import-everything-header.md) - Don't `#import` the world into one umbrella/prefix header
- [`proj-import-vs-forward-declare`](proj-import-vs-forward-declare.md) - Forward-declare with `@class`/`@protocol` in headers; `#import` in implementation files
- [`proj-umbrella-header`](proj-umbrella-header.md) - Provide one umbrella header for a framework's public API
