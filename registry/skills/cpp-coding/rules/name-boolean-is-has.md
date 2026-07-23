# name-boolean-is-has

> Prefix booleans with `is_`/`has_`/`can_`

## Why It Matters

A boolean-returning function or variable named with an `is_`/`has_`/`can_` (or similar) prefix reads as a natural-language question at the call site (`if (widget.is_visible())`), making conditional code self-documenting. A bare noun or ambiguous name forces the reader to check the declaration to learn it's boolean at all.

## Bad

```cpp
class Connection {
public:
    bool connected() const;   // Ambiguous: property? action? Reads awkwardly in an if
    bool error() const;        // Confusing: sounds like it might return an error object
private:
    bool valid;                 // Same ambiguity for the member
};

if (conn.connected()) { /* ... */ }   // Reads oddly: "if connection connected"
```

## Good

```cpp
class Connection {
public:
    bool is_connected() const;
    bool has_error() const;
private:
    bool is_valid_ = true;
};

if (conn.is_connected()) { /* ... */ }   // Reads naturally: "if is connected"
if (conn.has_error()) { /* ... */ }
```

## `can_`/`should_` for Capability/Permission Checks

```cpp
bool can_retry() const;
bool should_flush() const;

if (request.can_retry() && request.should_flush()) {
    retry_and_flush(request);
}
```

## See Also

- [name-functions-lower-snake](name-functions-lower-snake.md) - The general function-naming convention
- [type-enum-class-over-enum](type-enum-class-over-enum.md) - `enum class` when a bool would oversimplify a real tri-state
- [api-strong-types-over-bool](api-strong-types-over-bool.md) - Avoiding ambiguous bools in parameter position
