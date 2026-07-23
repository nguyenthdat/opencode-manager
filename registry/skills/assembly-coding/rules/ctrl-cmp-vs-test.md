# ctrl-cmp-vs-test

> Use `test` for zero/sign/bitmask checks and `cmp` for relational (greater/less/equal) comparisons

## Why It Matters

`test` computes a bitwise AND and discards the result, setting flags from that AND; `cmp` computes a subtraction and discards the result, setting flags from that subtraction. They overlap for equality checks but diverge for everything else — using `cmp $0` where `test` was intended (or vice-versa for a bitmask check) either wastes an instruction or produces the wrong flags for masked conditions.

## Bad

```asm
# x86-64 AT&T - cmp against 0 to test for zero: works, but 3 more bytes and less idiomatic
.global is_zero
is_zero:
    cmp  $0, %rdi
    sete %al
    movzbl %al, %eax
    ret
```

## Good

```asm
# x86-64 AT&T - test reg,reg is the idiomatic zero check; smaller encoding
.global is_zero
is_zero:
    test %rdi, %rdi
    sete %al
    movzbl %al, %eax
    ret
```

## Checking a Specific Bit or Mask

```asm
# x86-64 AT&T - test is the correct tool for bitmask checks; cmp cannot do this directly
.global has_flag_bit
has_flag_bit:
    # bool has_flag_bit(uint64_t flags) { return flags & (1 << 3); }
    test $0x8, %rdi
    setne %al
    movzbl %al, %eax
    ret
```

## Relational Comparisons Need cmp

```asm
# x86-64 AT&T - "is a < b" requires a real subtraction (cmp), test can't express this
.global is_less
is_less:
    cmp  %rsi, %rdi
    setl %al
    movzbl %al, %eax
    ret
```

## ARM64 Equivalent

```asm
// ARM64 - tst is the equivalent of x86's test (bitwise AND, discard result)
tst  x0, #0x8
cset x0, ne
```

## See Also

- [ctrl-flags-after-arith](ctrl-flags-after-arith.md) - Full reference of which instructions set which flags
- [ctrl-signed-vs-unsigned-jcc](ctrl-signed-vs-unsigned-jcc.md) - Choosing the branch that follows the comparison
- [ctrl-cmov-branchless](ctrl-cmov-branchless.md) - Branchless alternatives once flags are set
