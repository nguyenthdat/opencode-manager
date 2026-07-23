# name-avoid-abbreviation

> Avoid unclear abbreviations; spell out words

## Why It Matters

Abbreviations save a few keystrokes while writing but cost every future reader time deciphering them, and they don't autocomplete as helpfully as full words. Swift's guidelines favor clarity over brevity: `calculateDistance` is unambiguous, while `calcDist` requires guessing whether it means "distance," "distinct," or something else entirely.

## Bad

```swift
struct Cfg {
    var maxConn: Int
    var reqTimeout: TimeInterval
}

func calcTotAmt(items: [Item]) -> Double { ... }

class MsgMgr {
    func procMsg(_ m: Msg) { ... }
    func getUsrById(_ id: Int) -> Usr? { ... }
}

var idx = 0
var tmp: String?
var val: Double
```

## Good

```swift
struct Configuration {
    var maxConnections: Int
    var requestTimeout: TimeInterval
}

func calculateTotalAmount(items: [Item]) -> Double { ... }

class MessageManager {
    func process(_ message: Message) { ... }
    func user(withID id: Int) -> User? { ... }
}

var index = 0
var temporaryValue: String?
var amount: Double
```

## Well-Established Abbreviations Are Fine

```swift
// Widely recognized technical acronyms/abbreviations don't need spelling out;
// see name-acronym-consistent-case for their casing rules.
struct APIClient {
    func fetchHTML(from url: URL) -> String { ... }
}

let maxRetryCount = 3   // "max" is conventional, not obscure
let id: Int             // "id" is an established short form, not a mystery abbreviation

// Loop counters in tight, obvious scopes are acceptable.
for i in 0..<10 {
    print(i)
}
```

## See Also

- [`name-clarity-call-site`](name-clarity-call-site.md) - Clarity at the point of use
- [`name-acronym-consistent-case`](name-acronym-consistent-case.md) - Casing rules for acronyms
- [`name-generic-placeholder`](name-generic-placeholder.md) - When short names are acceptable for generics
