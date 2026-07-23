# interop-foundation-value-types

> Prefer Swift native value types over `NS*` counterparts when possible

## Why It Matters

Many `NS*` Foundation types (`NSString`, `NSArray`, `NSDictionary`, `NSNumber`) are reference types with mutable subclasses, designed for Objective-C's object model, while their Swift counterparts (`String`, `Array`, `Dictionary`, native numeric types) are value types with copy-on-write semantics, better performance for local mutation, and cleaner interop with generics and protocols like `Codable`/`Equatable`/`Hashable`. Reaching for `NSMutableArray` or `NSString` in new Swift code forfeits value semantics (silent aliasing bugs), forces bridging conversions at every API boundary, and blocks use of `Array`'s and `String`'s full standard-library API (functional operations, generics, `Sendable` conformance).

## Bad

```swift
class ReportBuilder {
    let lines: NSMutableArray = []          // reference type — aliasing risk
    var title: NSString = "Untitled"        // no Swift string interpolation/methods

    func addLine(_ line: NSString) {
        lines.add(line)
    }

    func summary() -> NSString {
        let joined = lines.componentsJoined(by: "\n")
        return "\(title)\n\(joined)" as NSString
    }
}

let shared = ReportBuilder()
let alias = shared                          // "copy" that's actually the same object
alias.addLine("mutated")                    // silently mutates `shared` too
```

## Good

```swift
struct ReportBuilder {
    private(set) var lines: [String] = []   // value type — no aliasing surprises
    var title: String = "Untitled"

    mutating func addLine(_ line: String) {
        lines.append(line)
    }

    func summary() -> String {
        "\(title)\n\(lines.joined(separator: "\n"))"
    }
}

var original = ReportBuilder()
var copy = original                         // real copy, copy-on-write
copy.addLine("mutated")                     // original is untouched
```

## When the `NS*` Type Is the Right Call

Keep the `NS*` type when an Objective-C API requires it directly (a delegate callback parameter, a property on a bridged class you don't own), or when you need reference semantics an Objective-C framework depends on for identity comparisons (`NSCache`, `NSNotification.object`). Convert at the boundary rather than threading `NSString`/`NSArray` through Swift-only logic:

```swift
func configure(_ legacyView: LegacyObjCView) {
    // Required by the Objective-C API surface — convert immediately, work in Swift after.
    let title = legacyView.title as String
    let items = (legacyView.items as? [String]) ?? []
    apply(title: title, items: items)   // Swift-native from here on
}
```

`NSNumber` bridging to `Int`/`Double`/`Bool` is largely automatic at Swift/Objective-C boundaries; avoid holding onto `NSNumber` in Swift-only model types where a concrete numeric type works.

## See Also

- [`interop-avoid-force-cast-anyobject`](interop-avoid-force-cast-anyobject.md) - safely converting bridged collection/value types
- [`mem-struct-value-semantics`](mem-struct-value-semantics.md) - the general value-type-by-default principle this specializes
- [`perf-avoid-bridging-overhead`](perf-avoid-bridging-overhead.md) - the performance cost of repeated Foundation bridging
