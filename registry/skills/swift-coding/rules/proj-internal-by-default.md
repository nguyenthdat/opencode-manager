# proj-internal-by-default

> Default new package types to `internal`; opt into `public` deliberately

## Why It Matters

`public` is a commitment: once a type, method, or property ships as `public` in a package, external consumers can depend on it, and removing or changing it becomes a breaking (major-version) change. Swift's default access level is already `internal`, but it's common to reach for `public` reflexively "so it compiles when I try it from the app target" without deciding whether that surface should really be part of the package's stable contract. Treating `internal` as the default and adding `public` only when an external consumer genuinely needs the symbol keeps the package's real API surface small, intentional, and safe to refactor.

## Bad

```swift
// NetworkingKit — everything marked public reflexively
public struct RequestBuilder {
    public var baseURL: URL
    public var headers: [String: String]

    public init(baseURL: URL, headers: [String: String] = [:]) {
        self.baseURL = baseURL
        self.headers = headers
    }

    public func buildRequest(path: String) -> URLRequest { /* ... */ }

    // Implementation detail that leaked into the public API by accident:
    public func normalizeHeaderCasing(_ headers: [String: String]) -> [String: String] { /* ... */ }
}
```

## Good

```swift
// NetworkingKit — only the genuine entry points are public
public struct RequestBuilder {
    public var baseURL: URL
    public var headers: [String: String]

    public init(baseURL: URL, headers: [String: String] = [:]) {
        self.baseURL = baseURL
        self.headers = headers
    }

    public func buildRequest(path: String) -> URLRequest {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.allHTTPHeaderFields = normalizeHeaderCasing(headers)
        return request
    }

    // Internal helper: free to change signature/behavior without a major version bump.
    func normalizeHeaderCasing(_ headers: [String: String]) -> [String: String] { /* ... */ }
}
```

## Auditing Public Surface Before a Release

Before cutting a release, grep the package's public targets for `public` and ask, for each hit, "would removing this break a real consumer, and do we intend to support that use forever?" A package-level lint or script can flag growth in public surface between releases:

```bash
# crude but effective: track public symbol count across tags
git show v1.2.0:Sources/NetworkingKit -- '*.swift' | grep -c '^\s*public '
git show HEAD:Sources/NetworkingKit -- '*.swift' | grep -c '^\s*public '
```

Also prefer `package` access (Swift 5.9+) for symbols that must cross target boundaries within the same package but should never be visible to external consumers — it closes the gap between `internal` (too narrow across targets) and `public` (too wide, external).

```swift
package struct InternalRetryPolicy { /* shared across targets, not exposed externally */ }
```

## See Also

- [`api-access-control-minimal`](api-access-control-minimal.md) - the general narrowest-access-level principle this specializes for packages
- [`proj-spm-module-boundaries`](proj-spm-module-boundaries.md) - the target boundaries `internal`/`package`/`public` operate across
- [`doc-public-api-required`](doc-public-api-required.md) - every symbol promoted to `public` needs documentation
