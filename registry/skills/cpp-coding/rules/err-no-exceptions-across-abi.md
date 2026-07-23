# err-no-exceptions-across-abi

> Don't let exceptions cross `extern "C"`

## Why It Matters

Exceptions rely on C++ runtime unwinding metadata that a C caller (or a different language's runtime) cannot interpret. Letting a C++ exception propagate out of a function called through a C ABI boundary is undefined behavior — at best a crash, at worst silent corruption. Every `extern "C"` function must catch and translate exceptions into an error code (or otherwise ensure none escape) before returning.

## Bad

```cpp
extern "C" int compute(int input) {
    return risky_computation(input);   // If this throws, the exception tries to
                                         // unwind through a C call frame — UB
}
```

## Good

```cpp
extern "C" int compute(int input, int* out_result) {
    try {
        *out_result = risky_computation(input);
        return 0;   // Success
    } catch (const std::exception& e) {
        log_error(e.what());
        return -1;  // Failure: translated to an error code the C caller understands
    } catch (...) {
        log_error("unknown exception");
        return -2;
    }
}
```

## `noexcept` as a Compile-Time-Adjacent Safety Net

```cpp
// Since C++11, if an exception escapes a noexcept function, std::terminate is
// called immediately instead of continuing to unwind through incompatible
// frames — often preferable to silent UB, though still not a substitute for
// translating errors properly at the boundary.
extern "C" int compute(int input, int* out_result) noexcept {
    try {
        *out_result = risky_computation(input);
        return 0;
    } catch (...) {
        return -1;
    }
}
```

## See Also

- [err-exceptions-vs-expected](err-exceptions-vs-expected.md) - Choosing error-reporting mechanism by context
- [err-noexcept-correctness](err-noexcept-correctness.md) - `noexcept` correctness in general
- [proj-cmake-target-based](proj-cmake-target-based.md) - Structuring ABI-facing targets separately
