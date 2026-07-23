# api-result-builder-dsl

> Use result builders for declarative DSLs

## Why It Matters

A result builder (`@resultBuilder`) lets callers describe a structure declaratively — a list of views, routes, or steps — using plain Swift control flow (`if`, `for`, `switch`) instead of manually building and appending to an array. This is the mechanism behind `SwiftUI`'s `ViewBuilder` and is equally useful for any domain where you want a readable, nested, conditional description of a tree of values.

## Bad

```swift
struct Route {
    let path: String
    let handler: () -> String
}

func buildRoutes(includeAdmin: Bool) -> [Route] {
    var routes: [Route] = []
    routes.append(Route(path: "/", handler: { "home" }))
    routes.append(Route(path: "/about", handler: { "about" }))
    if includeAdmin {
        routes.append(Route(path: "/admin", handler: { "admin" }))
    }
    return routes   // imperative construction, easy to get ordering/append logic wrong
}
```

## Good

```swift
@resultBuilder
enum RouteBuilder {
    static func buildBlock(_ routes: Route...) -> [Route] { routes }
    static func buildOptional(_ routes: [Route]?) -> [Route] { routes ?? [] }
    static func buildEither(first routes: [Route]) -> [Route] { routes }
    static func buildEither(second routes: [Route]) -> [Route] { routes }
    static func buildArray(_ routes: [[Route]]) -> [Route] { routes.flatMap { $0 } }
}

func makeRoutes(@RouteBuilder _ content: () -> [Route]) -> [Route] {
    content()
}

func buildRoutes(includeAdmin: Bool) -> [Route] {
    makeRoutes {
        Route(path: "/", handler: { "home" })
        Route(path: "/about", handler: { "about" })
        if includeAdmin {
            Route(path: "/admin", handler: { "admin" })
        }
    }
}
```

## A Minimal DSL End to End

```swift
struct HTMLNode {
    let tag: String
    let children: [HTMLNode]
}

@resultBuilder
enum HTMLBuilder {
    static func buildBlock(_ nodes: HTMLNode...) -> [HTMLNode] { nodes }
}

func div(@HTMLBuilder _ children: () -> [HTMLNode]) -> HTMLNode {
    HTMLNode(tag: "div", children: children())
}

func p(_ text: String) -> HTMLNode {
    HTMLNode(tag: "p", children: [])
}

let page = div {
    p("Welcome")
    p("This page was built with a result builder DSL")
}
```

Reach for a result builder when the domain is fundamentally about assembling a tree or sequence with conditional/looping structure; for a simple flat list of values, a plain array literal or variadic function is clearer and needs no custom builder type.

## See Also

- [`api-property-wrapper-reuse`](api-property-wrapper-reuse.md) - another declarative-API building block
- [`ui-view-small-composable`](ui-view-small-composable.md) - `ViewBuilder`, the canonical result builder in SwiftUI
- [`api-protocol-oriented`](api-protocol-oriented.md) - composing the leaf types a builder assembles
