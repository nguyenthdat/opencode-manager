# proj-private-headers-separate

> Keep private/internal headers out of the public framework header directory

## Why It Matters

Any header placed in a framework's public `Headers/` directory (or SwiftPM's `include/`) ships to every consumer and becomes part of your API contract whether you intended it or not. Once a private header like `OMWNetworkClient+Private.h` is public, third parties will `#import` it, call the "internal" methods it exposes, and file bugs when you rename or remove them in a patch release — you've accidentally frozen implementation detail as public API.

## Bad

```
OMWNetworking.framework/
  Headers/
    OMWNetworkClient.h
    OMWNetworkClient+Private.h     // Exposes internal-only methods:
                                    // -setMockResponseHandler:, -resetCache
    OMWRequestSigner.h              // Never meant to be called directly
                                    // by consumers, only by OMWNetworkClient
// Both extra headers are public. A consumer can now:
//   #import <OMWNetworking/OMWNetworkClient+Private.h>
//   [client setMockResponseHandler:...];
// and you can never safely change that method again without breaking them.
```

## Good

```
OMWNetworking.xcodeproj target settings:
  Public Headers:  OMWNetworkClient.h, OMWRequestBuilder.h, OMWNetworking.h
  Project Headers: OMWNetworkClient+Private.h, OMWRequestSigner.h
  (neither is "Private Headers" tier, which still ships in some
   distribution formats -- "Project" scope keeps them out of Headers/ entirely)
```

```objc
// OMWNetworkClient+Private.h -- a Project-scoped header, imported only
// by other implementation files inside the framework's own target,
// never copied into the framework bundle's public Headers/ directory.
#import "OMWNetworkClient.h"

NS_ASSUME_NONNULL_BEGIN

@interface OMWNetworkClient ()
- (void)setMockResponseHandler:(nullable OMWMockResponseHandler)handler;
- (void)resetCache;
@end

NS_ASSUME_NONNULL_END
```

## CocoaPods podspec Equivalent

```ruby
# Only files matching public_header_files ship as public API; anything
# else matched by source_files compiles into the framework but stays
# invisible to consumers importing the umbrella header.
s.source_files        = "Sources/OMWNetworking/**/*.{h,m}"
s.public_header_files = "Sources/OMWNetworking/Public/**/*.h"
```

## See Also

- [`proj-umbrella-header`](proj-umbrella-header.md) - Provide one umbrella header for a framework's public API
- [`proj-modulemap-for-framework`](proj-modulemap-for-framework.md) - Provide a `module.modulemap` for clean Swift/clang-module imports
- [`api-class-extension-private-api`](api-class-extension-private-api.md) - Hide private properties/methods in a class-extension (anonymous category)
