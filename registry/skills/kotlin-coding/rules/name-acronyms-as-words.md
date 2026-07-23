# name-acronyms-as-words

> Treat acronyms as words: `HttpClient`, not `HTTPClient`

## Why It Matters

All-caps acronyms break camelCase/PascalCase parsing rules — `HTTPSConnection` reads as a wall of capitals with no word boundaries, and multi-acronym names like `XMLHTTPRequest` become genuinely unreadable. The official Kotlin coding conventions explicitly recommend capitalizing acronyms as ordinary words for exactly this reason.

## Bad

```kotlin
class HTTPClient {
    fun sendXMLRequest(url: URL): HTTPResponse = TODO()
}

interface IOHandler {
    fun readJSON(): JSONObject
}

val APIKey = "secret"
```

## Good

```kotlin
class HttpClient {
    fun sendXmlRequest(url: Url): HttpResponse = TODO()
}

interface IoHandler {
    fun readJson(): JsonObject
}

val apiKey = "secret"
```

## Two-Letter Acronyms

```kotlin
class Id            // 2-letter acronyms also get treated as a word: "Id", not "ID"
val ioException: IOException  // exception from java.io keeps its original Java name
```

Note the JDK/Java standard library itself doesn't always follow this (e.g. `IOException`, `URL`); when subclassing or referencing those types, keep the platform's existing name rather than renaming it — apply this convention to your own newly-authored types.

## Ktlint/Detekt Rule

There's no dedicated automatic check for acronym casing (it's a sub-case of PascalCase/camelCase), but `detekt`'s `naming.ClassNaming` pattern `[A-Z][a-zA-Z0-9]*` will not flag `HTTPClient` — this convention is enforced by code review, not tooling.

## See Also

- [`name-classes-pascal`](name-classes-pascal.md) - the base rule this refines for acronym-heavy names
- [`name-functions-camel`](name-functions-camel.md) - the analogous rule for function/property names
- [`name-no-hungarian-notation`](name-no-hungarian-notation.md) - another naming-clarity convention
