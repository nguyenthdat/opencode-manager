# name-global-symbol-verb-noun

> Name externally-visible routines as verb_noun (`compute_checksum`, `parse_header`), mirroring standard C function-naming conventions

## Why It Matters

A verb_noun name immediately tells a caller what the function does (`compute_checksum`) rather than what it operates on alone (`checksum`, which reads more like a variable or type name). This is the same convention nearly every C standard library and codebase already follows, and asm entry points that break from it stand out as inconsistent in a mixed C/asm codebase.

## Bad

```asm
# x86-64 AT&T - noun-only names read ambiguously; unclear these are callable functions at all
.global checksum
checksum:
    ret

.global header
header:
    ret
```

## Good

```asm
# x86-64 AT&T - verb_noun names make the action and the callable nature of the symbol obvious
.global compute_checksum
compute_checksum:
    ret

.global parse_header
parse_header:
    ret
```

## Boolean-Returning Routines: is_/has_/can_ Prefix

For predicate routines specifically, follow the same `is_`/`has_`/`can_` convention used in high-level code:

```asm
# x86-64 AT&T
.global is_valid_header
is_valid_header:
    # bool is_valid_header(const uint8_t *data)
    ret
```

## Consistency With the Project's C Headers

If a project already declares `uint32_t crc32_compute(const uint8_t *, size_t)` in its C headers, the asm implementation should be named `crc32_compute` to match — don't introduce a second, differently-styled name purely because the implementation happens to live in a `.s` file.

## See Also

- [name-label-snake-case](name-label-snake-case.md) - The casing convention this pattern typically uses
- [interop-c-callable-wrapper](interop-c-callable-wrapper.md) - The header this name must match exactly
- [doc-entry-register-contract](doc-entry-register-contract.md) - Documenting the function once it's clearly named
