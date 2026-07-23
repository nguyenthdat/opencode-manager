# doc-example-usage

> Provide a minimal usage example for non-trivial APIs

## Why It Matters

A description of parameters and return values tells a reader what a function does in isolation, but a short example shows how it's meant to be used in context — often answering questions (ordering of calls, typical error handling, common configuration) that a parameter-by-parameter description leaves ambiguous.

## Bad

```cpp
/// Builds an HTTP request.
class RequestBuilder {
public:
    RequestBuilder& method(std::string_view m);
    RequestBuilder& url(std::string_view u);
    RequestBuilder& header(std::string_view key, std::string_view value);
    Request build();
    // No example: is method() required before url()? Can header() be called
    // multiple times? What does a typical call chain look like?
};
```

## Good

```cpp
/// Builds an HTTP request using a fluent interface.
///
/// \code
/// Request req = RequestBuilder()
///     .method("GET")
///     .url("https://api.example.com/users")
///     .header("Accept", "application/json")
///     .build();
/// \endcode
class RequestBuilder {
public:
    RequestBuilder& method(std::string_view m);
    RequestBuilder& url(std::string_view u);
    RequestBuilder& header(std::string_view key, std::string_view value);
    Request build();
};
```

## Doxygen Renders `\code`/`\endcode` as a Formatted Code Block

```cpp
/// Parses a duration string.
///
/// \code
/// auto d = parse_duration("500ms");
/// if (d) {
///     std::this_thread::sleep_for(*d);
/// }
/// \endcode
std::optional<std::chrono::milliseconds> parse_duration(std::string_view text);
```

## See Also

- [doc-doxygen-public-api](doc-doxygen-public-api.md) - The general documentation requirement
- [doc-generated-docs-ci](doc-generated-docs-ci.md) - Verifying examples compile/render correctly in CI
- [api-consistent-overload-set](api-consistent-overload-set.md) - Builder-pattern APIs like the one shown above
