# lint-no-dead-code-sections

> Remove unused labels, routines, and data rather than leaving them commented out or dead in the file

## Why It Matters

Dead asm — a routine no longer called from anywhere, a label with no remaining jump to it, a data table left over from a removed algorithm — costs real (if usually small) binary size, and much more importantly, costs every future reader's time trying to figure out whether it's actually unused or whether they're missing some subtle reason it's still needed. Version control already preserves history; there's no need to keep dead code "just in case" inside the live source.

## Bad

```asm
# x86-64 AT&T - old, unused routine left commented out "just in case," cluttering the file
.global compute_checksum
compute_checksum:
    # xor %eax, %eax          <- old approach, replaced below
    # ... 15 more commented-out lines of the previous implementation ...
    popcnt %rdi, %rax
    ret

# unused_helper:               <- no longer called from anywhere, dead weight
#     ret
```

## Good

```asm
# x86-64 AT&T - only the live, current implementation remains; history lives in version control
.global compute_checksum
compute_checksum:
    popcnt %rdi, %rax
    ret
```

## Verifying a Routine Is Actually Unreferenced Before Deleting It

```bash
# Check whether any object file in the build still references this symbol before removing it
nm -A *.o | grep unused_helper
grep -rn 'call.*unused_helper\|jmp.*unused_helper' src/
```

## If You Genuinely Need to Keep an Old Version for Reference

Reference an old implementation by its version-control history (a commit hash, a tag) in a comment, rather than physically keeping the dead code in the live file:

```asm
# x86-64 AT&T - the previous byte-by-byte implementation is preserved at commit a1b2c3d
# if it's ever needed as a reference; this is the current, SIMD-optimized replacement.
.global compute_checksum
compute_checksum:
    ...
```

## See Also

- [name-local-label-dot-L](name-local-label-dot-L.md) - Related label-hygiene discipline
- [doc-todo-fixme-tracked](doc-todo-fixme-tracked.md) - Tracking work genuinely still in progress, as distinct from dead code
- [lint-consistent-indentation-style](lint-consistent-indentation-style.md) - Broader file-cleanliness discipline
