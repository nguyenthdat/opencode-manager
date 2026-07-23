# proj-umbrella-header

> Provide one umbrella header for a framework's public API

## Why It Matters

Consumers of a framework should be able to write a single `#import <OMWNetworking/OMWNetworking.h>` (or `@import OMWNetworking;`) and get every public type. Without an umbrella header, callers must guess and hand-import each internal header individually, which breaks the moment you rename or reorganize a file, and it leaks your directory layout into every client's import list.

## Bad

```objc
// Consumer code has to know the framework's internal file layout.
#import <OMWNetworking/OMWNetworkClient.h>
#import <OMWNetworking/OMWRequestBuilder.h>
#import <OMWNetworking/OMWResponseParser.h>
#import <OMWNetworking/OMWNetworkingErrors.h>
// If OMWRequestBuilder.h is later renamed or split into two files,
// every consumer's import list silently breaks.
```

## Good

```objc
// OMWNetworking.h -- the framework's umbrella header, set as the
// "Umbrella Header" build setting for the OMWNetworking target.
#import <Foundation/Foundation.h>

//! Project version number for OMWNetworking.
FOUNDATION_EXPORT double OMWNetworkingVersionNumber;

//! Project version string for OMWNetworking.
FOUNDATION_EXPORT const unsigned char OMWNetworkingVersionString[];

#import <OMWNetworking/OMWNetworkClient.h>
#import <OMWNetworking/OMWRequestBuilder.h>
#import <OMWNetworking/OMWResponseParser.h>
#import <OMWNetworking/OMWNetworkingErrors.h>
```

```objc
// Consumer code -- one import gets the whole public API.
#import <OMWNetworking/OMWNetworking.h>

OMWNetworkClient *client = [[OMWNetworkClient alloc] initWithBaseURL:url];
```

## Keeping the Umbrella in Sync

```objc
// A unit test that fails the build if a public header is missing
// from the umbrella -- catches the most common umbrella-header bug.
- (void)testUmbrellaHeaderExposesAllPublicHeaders {
    NSBundle *bundle = [NSBundle bundleForClass:[OMWNetworkClient class]];
    NSArray<NSString *> *publicHeaders = [self allPublicHeaderNamesInBundle:bundle];
    for (NSString *headerName in publicHeaders) {
        XCTAssertTrue([self umbrellaHeaderImportsHeaderNamed:headerName],
                       @"OMWNetworking.h is missing #import for %@", headerName);
    }
}
```

## Swift Import Benefits

```swift
// With a correct umbrella header + module map, Swift gets a single
// clean module import instead of a bridging header per file:
import OMWNetworking

let client = OMWNetworkClient(baseURL: url)
```

## See Also

- [`proj-modulemap-for-framework`](proj-modulemap-for-framework.md) - Provide a `module.modulemap` for clean Swift/clang-module imports
- [`proj-private-headers-separate`](proj-private-headers-separate.md) - Keep private/internal headers out of the public framework header directory
- [`anti-import-everything-header`](anti-import-everything-header.md) - Don't `#import` the world into one umbrella/prefix header
