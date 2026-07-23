# err-nodiscard-fallible

> Mark fallible functions `[[nodiscard]]`

## Why It Matters

A function returning `std::expected`, an error code, or a `bool` success flag is only useful if the caller actually checks the result. Without `[[nodiscard]]`, the compiler allows the return value to be silently discarded, turning a checked-error design back into a silent-failure one at any call site that forgets to check.

## Bad

```cpp
std::expected<void, std::string> save(const Document& doc);

save(document);   // Return value silently discarded — save may have failed
                   // and the caller has no idea, and no compiler warning either.
```

## Good

```cpp
[[nodiscard]] std::expected<void, std::string> save(const Document& doc);

save(document);   // Compiler warning/error: "ignoring return value of function
                   // declared with 'nodiscard' attribute"

if (auto result = save(document); !result) {
    log_error(result.error());
}
```

## Applies to Bool-Returning and Pointer-Returning APIs Too

```cpp
[[nodiscard]] bool try_lock(std::mutex& m);

[[nodiscard]] Widget* find_widget(std::string_view name);
```

## Suppressing Deliberately

```cpp
// Rare, deliberate discard: cast to void to document the choice explicitly
(void)save(document);   // "I am knowingly ignoring this result" — visible, reviewable
```

## See Also

- [err-expected-for-recoverable](err-expected-for-recoverable.md) - `std::expected` return types
- [api-nodiscard-return](api-nodiscard-return.md) - `[[nodiscard]]` for API design more broadly
- [err-exceptions-vs-expected](err-exceptions-vs-expected.md) - Choosing this style of error handling
