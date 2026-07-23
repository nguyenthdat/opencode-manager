# name-local-label-dot-L

> Prefix labels that exist only for internal jumps within a routine with `.L` (GAS convention), and give them descriptive suffixes

## Why It Matters

`.L`-prefixed labels are stripped from the symbol table by GAS (see `syntax-local-vs-global-symbols`), so using this prefix consistently both signals "this label is implementation detail, not part of the public API" to readers, and keeps the object file's symbol table free of noise like `loop1`, `skip2`, `done3` that would otherwise show up in `nm` output and debuggers.

## Bad

```asm
# x86-64 AT&T - internal labels look like public API surface, and are numbered rather than descriptive
.global find_max
find_max:
    xor %eax, %eax
loop1:
    cmp %rsi, %rcx
    jge done1
    # ...
    jmp loop1
done1:
    ret
```

## Good

```asm
# x86-64 AT&T - .L-prefixed, descriptively named internal labels
.global find_max
find_max:
    xor %eax, %eax
.Lscan_loop:
    cmp %rsi, %rcx
    jge .Lscan_done
    # ...
    jmp .Lscan_loop
.Lscan_done:
    ret
```

## Naming Pattern: Purpose, Not Just Position

`.Lloop`/`.Ldone` communicate structure but not intent when a routine has more than one loop or exit point; prefer a short description of what the label marks:

```asm
# x86-64 AT&T - multiple loops in one routine, each clearly distinguished
.Lfind_delimiter_loop:
    ...
.Lcopy_remaining_loop:
    ...
.Lall_done:
    ret
```

## See Also

- [syntax-local-vs-global-symbols](syntax-local-vs-global-symbols.md) - Why .L labels are stripped from the symtab
- [name-label-snake-case](name-label-snake-case.md) - Naming convention for the exported routine itself
- [lint-no-dead-code-sections](lint-no-dead-code-sections.md) - Keeping labels (local or global) free of dead code
