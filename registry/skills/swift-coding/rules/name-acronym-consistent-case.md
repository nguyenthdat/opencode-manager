# name-acronym-consistent-case

> Treat acronyms consistently per Swift convention (`URL`, `id`)

## Why It Matters

Swift's convention is to keep acronyms in their standard all-caps form when they start or stand alone at the start of a type name (`URL`, `HTTP`, `JSON`), but lowercase them when they begin a value-level identifier (`url`, `id`, `json`) to preserve `lowerCamelCase`. Mixing this up (`Url`, `ID` as a property, `htmlParser` vs `HTMLParser`) creates visual noise and breaks the pattern-matching readers rely on from Apple's own APIs.

## Bad

```swift
struct Request {
    var Url: URL          // wrong casing for a property
    var httpMethod: String
    var ID: Int            // property should not be all-caps
}

struct urlSession { }      // type name should start uppercase, and acronym should be capitalized
class jsonDecoder { }       // should be JSONDecoder-style

func parseHtml(_ html: String) -> Document { ... } // inconsistent acronym casing
```

## Good

```swift
struct Request {
    var url: URL            // value-level: lowercase acronym
    var httpMethod: String
    var id: Int
}

struct URLSessionWrapper { }   // type-level: acronym stays capitalized
class JSONDecoder { }

func parseHTML(_ html: String) -> Document { ... }
```

## The General Rule

```swift
// Acronym at the START of a type name -> fully capitalized.
struct URLComponents { }
struct HTTPHeaderField { }

// Acronym at the START of a value-level name (var/func/param) -> fully lowercased.
let url: URL
let httpStatusCode: Int
func idFor(_ user: User) -> String { ... }

// Acronym in the MIDDLE or END of any name -> keeps its capitalization either way,
// matching stdlib/Foundation examples:
struct UserID { }          // ID capitalized at the end of a type name
let requestURL: URL        // URL capitalized at the end of a property name
let currentHTTPStatus: Int
```

## See Also

- [`name-type-upper-camel`](name-type-upper-camel.md) - UpperCamelCase for types
- [`name-func-lower-camel`](name-func-lower-camel.md) - lowerCamelCase for functions/properties
- [`name-avoid-hungarian-ns`](name-avoid-hungarian-ns.md) - Avoiding prefix cargo-culting
