# perf-return-value-optimization

> Rely on RVO/NRVO; return by value

## Why It Matters

Since C++17, "guaranteed copy elision" (RVO for a temporary constructed directly in the `return` statement) is mandated by the standard — there is no copy or move at all. Named Return Value Optimization (NRVO, for a named local variable) is not mandated but is performed by every major compiler in common cases. Together, they make returning by value essentially free, removing the historical performance justification for output parameters.

## Bad

```cpp
void compute(std::vector<int>& out_result) {   // Output parameter, avoiding a
    out_result.clear();                          // "costly" return-by-value that
    for (int i = 0; i < 100; ++i) out_result.push_back(i * i);
}                                                  // is not actually costly since C++17

std::vector<int> result;
compute(result);
```

## Good

```cpp
std::vector<int> compute() {
    std::vector<int> result;
    for (int i = 0; i < 100; ++i) result.push_back(i * i);
    return result;   // NRVO: no copy, no move, in virtually all compilers
}

auto result = compute();
```

## Guaranteed Copy Elision for Temporaries (C++17)

```cpp
std::vector<int> make_vector() {
    return std::vector<int>(100, 0);   // Guaranteed: constructed directly in the
}                                        // caller's storage, zero copies mandated by the standard
```

## Don't Fight the Optimization With `std::move`

```cpp
std::vector<int> compute() {
    std::vector<int> result;
    // ...
    return std::move(result);   // WRONG: this can actually PREVENT NRVO in some
}                                  // compilers/situations — just `return result;`
```

## See Also

- [api-return-value-not-out-param](api-return-value-not-out-param.md) - The API-design rationale for this rule
- [own-move-transfer](own-move-transfer.md) - When `std::move` on a return value is (rarely) appropriate
- [perf-move-semantics](perf-move-semantics.md) - Move semantics in general
