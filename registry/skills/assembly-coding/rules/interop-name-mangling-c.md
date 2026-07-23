# interop-name-mangling-c

> Give asm routines exactly the symbol name a C (not C++) compiler would produce, or explicitly match C++'s mangled name if calling into C++

## Why It Matters

A C compiler emits (mostly) the function name as-is, sometimes with a platform-specific leading underscore; a C++ compiler mangles the name to encode argument types and namespace, so `int add(int,int)` becomes something like `_Z3addii`. An asm routine meant to be called from C++ using its plain name will fail to link unless the C++ side declares it `extern "C"`, and an asm routine meant to implement a C++ function needs the exact mangled name (fragile) or, far better, a matching `extern "C"` boundary.

## Bad

```cpp
// C++ header - declares without extern "C", so the compiler expects a mangled symbol
int add_fast(int a, int b);   // BUG: compiler will look for a mangled symbol, e.g. _Z8add_fastii
```

```asm
# x86-64 AT&T - defines the plain, unmangled name; won't satisfy the mangled reference above
.global add_fast
add_fast:
    lea (%rdi,%rsi), %eax
    ret
```

## Good

```cpp
// C++ header - extern "C" tells the compiler to use the plain C name, matching the asm symbol
extern "C" int add_fast(int a, int b);
```

```asm
# x86-64 AT&T - plain name now matches what the extern "C" declaration expects
.global add_fast
add_fast:
    lea (%rdi,%rsi), %eax
    ret
```

## Checking the Expected Symbol Name

```bash
# See exactly what symbol name the linker is looking for
nm main.o | grep add_fast
# or demangle a C++ symbol to see what it decodes to
c++filt _Z8add_fastii
```

## Platform Leading-Underscore Convention

Some platforms (historically macOS, some Windows toolchains) prepend an underscore to C symbol names at the assembler/linker level; use `__USER_LABEL_PREFIX__`-aware macros or check with `nm` on the actual target rather than assuming Linux's no-prefix convention applies everywhere.

## See Also

- [interop-symbol-naming-underscore](interop-symbol-naming-underscore.md) - The leading-underscore platform convention in depth
- [interop-c-callable-wrapper](interop-c-callable-wrapper.md) - Wrapping asm with a clean C-callable signature
- [syntax-global-visibility](syntax-global-visibility.md) - Exporting the symbol at all
