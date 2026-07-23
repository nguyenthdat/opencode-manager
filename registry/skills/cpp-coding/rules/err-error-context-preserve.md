# err-error-context-preserve

> Preserve original cause when wrapping errors

## Why It Matters

When a higher-level operation catches a low-level error and re-reports it in its own terms, discarding the original error loses the actual root cause — the information most useful for debugging. Wrapping should add context while keeping (or nesting) the original error, not replace it.

## Bad

```cpp
void load_config(const std::string& path) {
    try {
        parse(read_file(path));
    } catch (const std::exception&) {
        throw std::runtime_error("failed to load config");
        // Original error (e.g. "permission denied" vs "malformed JSON on line 12")
        // is discarded — the new message tells you nothing about the actual cause.
    }
}
```

## Good — Nested Exception (`std::throw_with_nested`)

```cpp
void load_config(const std::string& path) {
    try {
        parse(read_file(path));
    } catch (...) {
        std::throw_with_nested(std::runtime_error("failed to load config: " + path));
    }
}

void print_exception(const std::exception& e, int depth = 0) {
    std::cerr << std::string(depth, ' ') << e.what() << '\n';
    try {
        std::rethrow_if_nested(e);
    } catch (const std::exception& nested) {
        print_exception(nested, depth + 1);   // Prints the full cause chain
    } catch (...) {}
}
```

## Good — `std::expected` With Context Wrapping

```cpp
std::expected<Config, std::string> load_config(const std::string& path) {
    auto text = read_file(path);
    if (!text) return std::unexpected("failed to load config " + path + ": " + text.error());
    return parse(*text);
}
```

## See Also

- [err-custom-exception-hierarchy](err-custom-exception-hierarchy.md) - Structuring exception types that carry context
- [err-expected-for-recoverable](err-expected-for-recoverable.md) - Wrapping error strings/types with `expected`
- [doc-doxygen-public-api](doc-doxygen-public-api.md) - Documenting what errors a function can produce
