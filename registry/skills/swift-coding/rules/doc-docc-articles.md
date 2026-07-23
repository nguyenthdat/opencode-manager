# doc-docc-articles

> Use DocC articles/tutorials for conceptual documentation

## Why It Matters

Symbol-level `///` comments are the right place for "what does this function do," but they're the wrong place for cross-cutting concepts like "how does authentication flow through this SDK" or "which of these three similar APIs should I use." DocC articles (`.md` files in a `.docc` catalog) and tutorials give that conceptual material a proper home with its own navigable page, code listings, and images, separate from any single symbol's reference doc.

## Bad

```swift
/// The primary entry point for the networking library.
///
/// To use this library: first create a `Session`, then configure
/// authentication by setting up an `AuthProvider`, which might be
/// an `OAuthProvider` or an `APIKeyProvider` depending on your backend,
/// then... (500 more words explaining the whole architecture inline,
/// duplicated across several types' doc comments)
public struct Session {
    ...
}
```

## Good

```
NetworkingKit.docc/
├── NetworkingKit.md              // Landing page, links to articles below
├── GettingStarted.md             // Article: install, first request
├── Authentication.md             // Article: OAuth vs API key providers, when to use each
└── Resources/
    └── auth-flow-diagram.png
```

```swift
/// The primary entry point for the networking library.
///
/// For an overview of session setup and authentication, see
/// <doc:GettingStarted> and <doc:Authentication>.
public struct Session {
    ...
}
```

## Article Content Example

```markdown
# Authentication

Learn which authentication provider to use for your backend.

## Overview

``Session`` delegates authentication to an ``AuthProviding`` conformer.
Use ``OAuthProvider`` for backends that issue short-lived bearer tokens,
or ``APIKeyProvider`` for static API keys.

```swift
let session = Session(authProvider: OAuthProvider(clientID: "abc123"))
```

### Choosing a Provider

| Backend requires | Use |
|---|---|
| OAuth2 refresh tokens | ``OAuthProvider`` |
| Static API key header | ``APIKeyProvider`` |
```

## See Also

- [`doc-triple-slash-summary`](doc-triple-slash-summary.md) - Symbol-level doc comments
- [`doc-link-symbols`](doc-link-symbols.md) - Cross-linking symbols from articles
- [`doc-public-api-required`](doc-public-api-required.md) - What must be documented at the symbol level
