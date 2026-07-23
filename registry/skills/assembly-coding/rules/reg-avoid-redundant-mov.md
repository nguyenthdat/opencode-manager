# reg-avoid-redundant-mov

> Eliminate register-to-register moves that only exist to rename a value, not to change it

## Why It Matters

Every extra `mov` is an instruction the front end must decode and (on most microarchitectures) a slot in the reorder buffer, even though modern CPUs eliminate pure register-to-register moves via register renaming in many cases. Writing the destination register directly from the producing instruction avoids relying on that optimization and keeps the code shorter and easier to read.

## Bad

```asm
# x86-64 AT&T - unnecessary shuffle through rax before returning
.global compute
compute:
    add  %rsi, %rdi
    mov  %rdi, %rax     # copy just to satisfy the return-value convention
    ret
```

## Good

```asm
# x86-64 AT&T - compute directly into rax, the return register
.global compute
compute:
    mov  %rdi, %rax
    add  %rsi, %rax
    ret
```

Neither version can avoid *every* move — the point is to avoid the ones that add no value once you plan which register will hold the final result.

## A Chain of Redundant Copies

```asm
# x86-64 AT&T - three registers holding the same value, no reason for it
mov  %rdi, %rax
mov  %rax, %rbx
mov  %rbx, %rcx      # now rcx == rdi, reached the long way
```

```asm
# x86-64 AT&T - use %rdi directly, or copy once if you truly need two live copies
mov %rdi, %rcx
```

## When an Extra Move Is Justified

A move that puts a value into the correct ABI register before a `call`, or that saves a value into a callee-saved register before a nested call clobbers the original, is not redundant — it changes which register holds the value for a real reason.

## See Also

- [reg-lea-address-compute](reg-lea-address-compute.md) - Another way to fold computation into fewer instructions
- [perf-avoid-false-dependency](perf-avoid-false-dependency.md) - Why extra moves can also introduce dependency chains
- [perf-instruction-level-parallelism](perf-instruction-level-parallelism.md) - Broader instruction-scheduling guidance
