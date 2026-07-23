# perf-avoid-bridging-overhead

> Avoid unnecessary Swift/Foundation/NSObject bridging

## Why It Matters

Bridging between Swift native types and their Objective-C/Foundation counterparts (`String` <-> `NSString`, `Array` <-> `NSArray`, `Dictionary` <-> `NSDictionary`) isn't free: it can force a copy, box values, or fall back to slow generic `NSObject` message dispatch instead of Swift's specialized, inlinable code paths. Staying in native Swift types through a hot path—and bridging only at the boundary where an Objective-C API truly requires it—avoids that repeated cost.

## Bad

```swift
func normalizedTitles(_ titles: [String]) -> [String] {
    // Bridges every String to NSString on each iteration just to lowercase it.
    titles.map { ($0 as NSString).lowercased as String? ?? $0 }
}

func countWords(in text: String) -> Int {
    // NSString word-splitting round-trips through Foundation unnecessarily.
    let nsText = text as NSString
    var count = 0
    nsText.enumerateSubstrings(in: NSRange(location: 0, length: nsText.length), options: .byWords) { _, _, _, _ in
        count += 1
    }
    return count
}
```

## Good

```swift
func normalizedTitles(_ titles: [String]) -> [String] {
    titles.map { $0.lowercased() } // pure Swift String API, no bridging
}

func countWords(in text: String) -> Int {
    text.split(separator: " ").count // native Swift Collection API
}
```

## When Bridging Is Actually Necessary

```swift
import Foundation

// Bridge only at the boundary where an Objective-C-only API requires it.
func attributedTitle(from title: String) -> NSAttributedString {
    NSAttributedString(string: title, attributes: [.font: UIFont.boldSystemFont(ofSize: 17)])
}

// Prefer the native Swift Foundation value types where they exist
// (URL, Date, Data, Measurement) over their NS-prefixed counterparts,
// since these bridge implicitly and cheaply when Swift APIs need them.
let url = URL(string: "https://example.com")! // not NSURL directly
let date = Date()                              // not NSDate directly
```

## See Also

- [`perf-contiguous-array`](perf-contiguous-array.md) - Native storage that avoids bridging
- [`interop-foundation-value-types`](interop-foundation-value-types.md) - Preferring Swift value types at Foundation boundaries
- [`interop-objc-expose-minimal`](interop-objc-expose-minimal.md) - Minimizing `@objc` surface that forces bridging
