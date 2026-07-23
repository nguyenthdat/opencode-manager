# err-optional-for-absence

> Use `std::optional<T>` for absence, not errors

## Why It Matters

`std::optional<T>` communicates "a value may legitimately be absent" — a lookup that found nothing, a parameter that wasn't provided. It carries no information about *why* the value is missing. When the caller needs to know the cause of a failure (to log it, retry differently, or report it to a user), `std::expected<T,E>` or an exception is the right tool instead; conflating the two hides useful diagnostic information.

## Bad

```cpp
// Using optional when the caller genuinely needs to know WHY something failed
std::optional<User> load_user(int id) {
    if (!db_connected()) return std::nullopt;     // Connection failure
    if (!user_exists(id)) return std::nullopt;    // Not found
    if (!has_permission(id)) return std::nullopt; // Permission denied
    return fetch_user(id);
}
// Caller sees only "nothing", with no way to distinguish these three cases.
```

## Good

```cpp
// Absence with no cause to report: optional is correct here
std::optional<int> find_index(const std::vector<int>& v, int target) {
    auto it = std::find(v.begin(), v.end(), target);
    return it != v.end() ? std::optional(std::distance(v.begin(), it)) : std::nullopt;
}

// Distinct, meaningful failure causes: expected is correct here
enum class LoadError { NotConnected, NotFound, PermissionDenied };

std::expected<User, LoadError> load_user(int id) {
    if (!db_connected()) return std::unexpected(LoadError::NotConnected);
    if (!user_exists(id)) return std::unexpected(LoadError::NotFound);
    if (!has_permission(id)) return std::unexpected(LoadError::PermissionDenied);
    return fetch_user(id);
}
```

## Rule of Thumb

Ask: "If this returns nothing, does the caller need to know why to respond correctly?" If yes, use `expected`/exceptions. If the absence itself is the entire answer (e.g. "not found" with one obvious meaning), `optional` is simpler and sufficient.

## See Also

- [err-expected-for-recoverable](err-expected-for-recoverable.md) - `expected` for failures with a cause
- [type-optional-nullable](type-optional-nullable.md) - `optional` usage patterns in depth
- [err-exceptions-vs-expected](err-exceptions-vs-expected.md) - The broader error-mechanism decision
