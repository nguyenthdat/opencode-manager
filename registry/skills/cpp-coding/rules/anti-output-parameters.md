# anti-output-parameters

> Don't use output parameters when you can return a value

## Why It Matters

Guaranteed copy elision and NRVO (C++17+) make returning by value essentially free in the common case, so output parameters mostly just obscure a function's purpose (you must read the whole signature, not just the return type, to know what it produces) without any remaining performance benefit.

## Bad

```cpp
void compute_stats(const std::vector<int>& data, double& out_mean, double& out_stddev);

double mean, stddev;
compute_stats(data, mean, stddev);   // Must pre-declare both, nothing enforces they're set
```

## Good

```cpp
struct Stats { double mean; double stddev; };

Stats compute_stats(const std::vector<int>& data);

auto [mean, stddev] = compute_stats(data);   // Return value, unpacked with structured bindings
```

## See Also

- [api-return-value-not-out-param](api-return-value-not-out-param.md) - Full rationale and decision guidance
- [perf-return-value-optimization](perf-return-value-optimization.md) - Why by-value return is not a performance trade-off
- [type-structured-bindings](type-structured-bindings.md) - Consuming multi-value returns cleanly
