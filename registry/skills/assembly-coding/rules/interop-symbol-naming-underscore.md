# interop-symbol-naming-underscore

> Check whether the target platform's C toolchain prepends an underscore to symbol names before assuming your asm label matches the linker's expectation

## Why It Matters

Some platform ABIs (classic macOS/Mach-O toolchains, some older Windows/DOS toolchains, certain embedded targets) historically prepend a leading underscore to every C-visible symbol name, while Linux ELF toolchains typically do not. Hardcoding a symbol name that matches one convention breaks silently on a platform using the other, producing an "undefined symbol" link error that looks unrelated to the actual cause.

## Bad

```asm
# x86-64 AT&T - assumes no leading underscore, breaks on a toolchain that requires one
.global fast_checksum
fast_checksum:
    ret
```

```c
/* On a platform requiring a leading underscore, the C compiler emits a reference to
   "_fast_checksum", but the symbol above is named "fast_checksum" -- link failure */
uint32_t fast_checksum(const uint8_t *data, size_t len);
```

## Good

```c
/* portable_asm.h - a small macro that adapts to the platform's naming convention */
#if defined(__APPLE__)
#  define C_SYMBOL(name) _##name
#else
#  define C_SYMBOL(name) name
#endif
```

```asm
# x86-64 AT&T - use the platform-appropriate symbol name via the assembler's own preprocessor,
# or generate the .s file from a template that substitutes the right prefix
#if defined(__APPLE__)
.global _fast_checksum
_fast_checksum:
#else
.global fast_checksum
fast_checksum:
#endif
    ret
```

## Verifying the Convention on a Given Toolchain

```bash
# Compile a trivial C function and inspect the emitted symbol name directly
echo 'int f(void){return 0;}' | gcc -S -o - -xc -    | grep -A1 '^_\?f:'
nm a.out | grep -i ' f$'
```

## See Also

- [interop-name-mangling-c](interop-name-mangling-c.md) - The related C vs C++ naming distinction
- [syntax-global-visibility](syntax-global-visibility.md) - Exporting the symbol at all
- [proj-per-arch-directory-layout](proj-per-arch-directory-layout.md) - Organizing platform-specific variants
