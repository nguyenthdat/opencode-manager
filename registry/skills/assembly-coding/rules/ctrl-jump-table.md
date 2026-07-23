# ctrl-jump-table

> Implement a dense multi-way switch as a jump table instead of a chain of compares

## Why It Matters

A linear chain of `cmp`/`je` for a switch over N dense cases costs O(N) comparisons in the worst case and is unpredictable for the CPU's branch predictor. A jump table computes the target address directly from the case value in O(1), using a single indirect jump, which is exactly what compilers emit for dense `switch` statements at `-O2`+.

## Bad

```asm
# x86-64 AT&T - linear chain of comparisons for a dense 0..3 switch
.global dispatch_wrong
dispatch_wrong:
    cmp  $0, %rdi
    je   .case0
    cmp  $1, %rdi
    je   .case1
    cmp  $2, %rdi
    je   .case2
    cmp  $3, %rdi
    je   .case3
    jmp  .default
.case0: mov $10, %rax
        ret
.case1: mov $20, %rax
        ret
.case2: mov $30, %rax
        ret
.case3: mov $40, %rax
        ret
.default: mov $-1, %rax
        ret
```

## Good

```asm
# x86-64 AT&T - jump table: O(1) dispatch via an indirect jump
.section .rodata
.align 8
jump_table:
    .quad .case0, .case1, .case2, .case3

.section .text
.global dispatch
dispatch:
    cmp  $3, %rdi
    ja   .default             # bounds check: unsigned compare catches negative too
    lea  jump_table(%rip), %rax
    jmp  *(%rax,%rdi,8)
.case0: mov $10, %rax
        ret
.case1: mov $20, %rax
        ret
.case2: mov $30, %rax
        ret
.case3: mov $40, %rax
        ret
.default: mov $-1, %rax
        ret
```

## The Bounds Check Is Not Optional

A jump table with no upper-bound check turns an out-of-range switch value into a jump to an arbitrary address computed from attacker- or bug-controlled memory — always validate the index before indexing into the table (the `ja .default` above relies on the unsigned-compare trick to reject both negative and too-large indices in one instruction).

## ARM64 Equivalent

```asm
// ARM64 - equivalent jump-table dispatch using adr + ldr + br
.global dispatch
dispatch:
    cmp  x0, #3
    b.hi .default
    adr  x1, jump_table
    ldr  x1, [x1, x0, lsl #3]
    br   x1
```

## See Also

- [ctrl-signed-vs-unsigned-jcc](ctrl-signed-vs-unsigned-jcc.md) - The unsigned-compare bounds-check trick used above
- [mem-rip-relative](mem-rip-relative.md) - PIC-safe addressing for the jump table itself
- [safe-uninitialized-register-read](safe-uninitialized-register-read.md) - Related "never trust unchecked input" discipline
