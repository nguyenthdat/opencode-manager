# type-structured-bindings

> Use structured bindings to unpack aggregates

## Why It Matters

Before C++17, unpacking a `std::pair`/`std::tuple`/struct required verbose `.first`/`.second` access or `std::tie`. Structured bindings destructure any tuple-like type (or public-member aggregate) directly into named variables in a single declaration, making the code read closer to the underlying intent.

## Bad

```cpp
std::map<std::string, int> scores;
auto result = scores.insert({"alice", 90});
if (result.second) {                    // What does .second mean here? Unclear
    std::cout << result.first->first;    // .first->first — hard to read
}

std::pair<int, int> divide(int a, int b) {
    return {a / b, a % b};
}
auto result2 = divide(17, 5);
std::cout << result2.first << " " << result2.second;
```

## Good

```cpp
auto [it, inserted] = scores.insert({"alice", 90});
if (inserted) {
    std::cout << it->first;   // Clear names replace .first/.second entirely
}

std::pair<int, int> divide(int a, int b) {
    return {a / b, a % b};
}
auto [quotient, remainder] = divide(17, 5);
std::cout << quotient << " " << remainder;
```

## Unpacking Structs Too

```cpp
struct Point { double x; double y; };
Point p{3.0, 4.0};
auto [x, y] = p;   // Binds x and y to p's members directly

for (const auto& [key, value] : scores) {   // Common idiom: iterating a map
    std::cout << key << " = " << value << "\n";
}
```

## See Also

- [api-return-value-not-out-param](api-return-value-not-out-param.md) - Multi-value returns that pair naturally with this
- [type-auto-when-clear](type-auto-when-clear.md) - `auto` usage alongside structured bindings
- [type-variant-over-union](type-variant-over-union.md) - Related C++17 pattern-matching-adjacent features
