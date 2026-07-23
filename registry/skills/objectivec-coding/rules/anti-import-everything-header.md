# anti-import-everything-header

> Don't `#import` the world into one umbrella/prefix header

## Why It Matters

An umbrella or prefix header that imports every framework and every internal class "just in case" defeats the purpose of both mechanisms: consumers of the umbrella header get the entire dependency graph whether they need it or not, and a change to any one imported header forces recompilation of every file in the target because the prefix header (or umbrella) touches all of them. It also makes it impossible to tell, from a given file, what that file actually depends on — everything looks reachable because it technically is, via the mega-header.

## Bad

```objc
// OMWStore-Prefix.pch
#ifdef __OBJC__
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <CoreData/CoreData.h>
#import <CoreLocation/CoreLocation.h>
#import <MapKit/MapKit.h>
#import <AVFoundation/AVFoundation.h>
#import <StoreKit/StoreKit.h>
#import "OMWNetworkClient.h"
#import "OMWSessionManager.h"
#import "OMWAnalyticsLogger.h"
#import "OMWConstants.h"
// Every .m file in the target now silently sees StoreKit and MapKit,
// so it's impossible to tell from a single file's own #imports whether
// it genuinely needs in-app purchases or map annotations, or is just
// inheriting them for free from this header.
#endif
```

## Good

```objc
// OMWStore-Prefix.pch -- only the one framework nearly every file uses.
#ifdef __OBJC__
#import <Foundation/Foundation.h>
#endif
```

```objc
// OMWStoreKitPurchaseManager.m -- imports StoreKit explicitly, right
// where it's actually used, so the dependency is visible in the file
// that owns it.
#import "OMWStoreKitPurchaseManager.h"
#import <StoreKit/StoreKit.h>

@implementation OMWStoreKitPurchaseManager
// ...
@end
```

```objc
// OMWNetworking.h -- a legitimate umbrella header still only imports
// the public headers of its own framework's public API surface, never
// unrelated frameworks or every internal class.
#import <OMWNetworking/OMWNetworkClient.h>
#import <OMWNetworking/OMWRequestBuilder.h>
#import <OMWNetworking/OMWResponseParser.h>
```

## Why This Happens

It typically starts innocently: one file needs `MapKit`, so someone adds it to the shared prefix header "to save typing" instead of importing it locally. Each subsequent addition looks equally harmless in isolation, but the header accretes into a dependency dumping ground that nobody wants to be the one to clean up, since removing any single import risks an unrelated build break somewhere in the target.

## How to Fix It

Audit the prefix/umbrella header periodically: for each import, grep the target for actual usages of symbols from that header outside of it. Anything used by only a handful of files should move to those files' own `#import` lists.

## See Also

- [`proj-pch-minimal`](proj-pch-minimal.md) - Keep the precompiled prefix header minimal; avoid dumping every import into it
- [`proj-umbrella-header`](proj-umbrella-header.md) - Provide one umbrella header for a framework's public API
- [`proj-import-vs-forward-declare`](proj-import-vs-forward-declare.md) - Forward-declare with `@class`/`@protocol` in headers; `#import` in implementation files
