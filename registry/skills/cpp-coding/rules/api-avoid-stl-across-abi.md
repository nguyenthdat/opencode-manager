# api-avoid-stl-across-abi

> Don't expose STL containers across unstable ABI

## Why It Matters

STL container layouts (`std::string`, `std::vector`) are not guaranteed to be binary-compatible across compiler versions, standard library implementations (libstdc++ vs libc++ vs MSVC STL), or even different build configurations (debug iterators, allocator settings) of the *same* compiler. Passing them by value across a shared-library boundary compiled with a different toolchain/settings than the caller is undefined behavior.

## Bad

```cpp
// mylib.hpp — shipped as a prebuilt shared library (.so/.dll) for third parties
// to link against with THEIR OWN compiler, which may differ from yours.
class MyLib {
public:
    std::vector<std::string> get_names();   // Layout not guaranteed stable
                                               // across the caller's toolchain
};
```

## Good — C-Compatible or PIMPL-Isolated Boundary

```cpp
// mylib.h — stable C ABI boundary
extern "C" {
    typedef struct MyLibHandle MyLibHandle;
    MyLibHandle* mylib_create(void);
    void mylib_destroy(MyLibHandle*);
    // Caller-allocated buffer + explicit length: no STL types cross the boundary
    size_t mylib_get_names(MyLibHandle*, char* buffer, size_t buffer_size);
}

// Internally, mylib.cpp is free to use std::vector<std::string> as much as it likes —
// STL types just never appear IN THE PUBLIC SIGNATURE that crosses the ABI boundary.
```

## When It's Safe to Use STL Types Across a Boundary

```cpp
// Safe: statically linked into the SAME binary, or a shared library built
// with the exact same compiler, standard library, and ABI-relevant flags
// as every consumer (verified and enforced by the build system).
// This is common within a single organization's monorepo, less safe for
// a library distributed to unknown third-party consumers.
```

## See Also

- [api-pimpl-abi-stability](api-pimpl-abi-stability.md) - Hiding STL types behind an opaque pointer
- [err-no-exceptions-across-abi](err-no-exceptions-across-abi.md) - The equivalent concern for exceptions
- [proj-cmake-target-based](proj-cmake-target-based.md) - Structuring build targets around ABI boundaries
