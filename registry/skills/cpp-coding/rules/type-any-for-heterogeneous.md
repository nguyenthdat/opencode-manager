# type-any-for-heterogeneous

> Use `std::any` sparingly, only for real type erasure

## Why It Matters

`std::any` can hold a value of literally any copyable type, but retrieving it requires knowing (or checking) the exact type via `std::any_cast`, which throws (or returns null for the pointer form) on a mismatch — there is no compile-time safety at all. It's justified only when the actual type genuinely isn't known until runtime (a generic plugin registry, heterogeneous property bag); reach for `std::variant` whenever the set of possible types is actually known in advance.

## Bad — Known Type Set Doesn't Need `any`

```cpp
std::any config_value = 42;   // Could be int, string, bool, double — but in
                                // this specific application, it's ALWAYS one
                                // of a small, known set of types.

int x = std::any_cast<int>(config_value);   // Throws std::bad_any_cast if wrong,
                                               // with no compile-time protection at all
```

## Good — Use `std::variant` When the Type Set Is Known

```cpp
using ConfigValue = std::variant<int, std::string, bool, double>;

ConfigValue value = 42;
if (auto* i = std::get_if<int>(&value)) {
    use(*i);   // Checked, no exception risk, and the compiler knows the full set
}
```

## Good — `std::any` for Genuine, Open-Ended Type Erasure

```cpp
class PluginRegistry {
public:
    template <typename T>
    void set(std::string_view key, T value) {
        properties_[std::string(key)] = std::move(value);   // Genuinely unknown types:
    }                                                          // third-party plugins register

    template <typename T>
    std::optional<T> get(std::string_view key) const {
        auto it = properties_.find(std::string(key));
        if (it == properties_.end()) return std::nullopt;
        if (auto* value = std::any_cast<T>(&it->second)) return *value;
        return std::nullopt;
    }
private:
    std::unordered_map<std::string, std::any> properties_;
};
```

## See Also

- [type-variant-over-union](type-variant-over-union.md) - The preferred alternative when types are known
- [anti-void-star-type-erasure](anti-void-star-type-erasure.md) - `std::any` as a type-safe alternative to `void*`
- [tmpl-concepts-over-sfinae](tmpl-concepts-over-sfinae.md) - Compile-time genericity as another alternative
