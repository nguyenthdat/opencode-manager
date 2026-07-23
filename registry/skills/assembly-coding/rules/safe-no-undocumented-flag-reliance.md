# safe-no-undocumented-flag-reliance

> Only rely on flag side effects the architecture manual explicitly documents as guaranteed; never depend on an "observed" but undocumented behavior

## Why It Matters

Some instructions have flag effects that are officially "undefined" for certain operand combinations (notably shift instructions with a shift count of zero on x86, or certain multiply forms) even though a specific CPU generation might, in practice, leave flags in a particular observable state. Code that relies on this observed-but-unguaranteed behavior can break on a future CPU stepping, a different vendor's implementation of the same architecture, or even the same CPU under different microcode — all without any change to the source code.

## Bad

```asm
# x86-64 AT&T - relies on shl's flag behavior with a shift count of 0, which the manual
# documents as leaving flags UNCHANGED/undefined in some encodings, not something to build logic on
.global check_after_shift_wrong
check_after_shift_wrong:
    shl  %cl, %rax      # if %cl happens to be 0, flags may be left from a PRIOR instruction
    jz   .was_zero        # BUG-prone: this branch may test stale flags, not this shift's result
    ret
.was_zero:
    ret
```

## Good

```asm
# x86-64 AT&T - test the actual value explicitly instead of relying on a shift's flag side effect
.global check_after_shift
check_after_shift:
    shl  %cl, %rax
    test %rax, %rax      # explicit, always-defined test of the actual current value
    jz   .was_zero
    ret
.was_zero:
    ret
```

## Consult the Manual, Not Just Observed Behavior

The Intel/AMD architecture manuals explicitly call out which flag effects are guaranteed versus which are "undefined"/implementation-specific for certain operand forms (shift-by-zero being the classic example on x86). Treat any flag behavior not explicitly documented as guaranteed as unreliable, even if it "always seems to work" in local testing.

## This Extends to Relying on Reserved Bits or Unspecified Register State

The same principle applies more broadly: never build logic on a reserved instruction encoding bit's observed behavior, an unspecified register's "usual" reset value, or any other behavior the architecture manual doesn't explicitly promise — these are exactly the details most likely to change across implementations.

## See Also

- [ctrl-flags-after-arith](ctrl-flags-after-arith.md) - Documented flag behavior to rely on instead
- [ctrl-cmp-vs-test](ctrl-cmp-vs-test.md) - The explicit, always-defined test this rule recommends
- [doc-bit-trick-explain](doc-bit-trick-explain.md) - Documenting which behaviors a trick actually depends on
