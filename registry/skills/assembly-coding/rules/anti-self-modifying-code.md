# anti-self-modifying-code

> Don't write code that modifies its own instructions in memory during normal execution

## Why It Matters

Beyond the performance penalty (pipeline flush, instruction cache invalidation) covered in `perf-avoid-self-modifying-code`, self-modifying code is also extremely difficult to debug (a disassembler shows the code as it was at load time, not as it becomes at runtime), is rejected outright by NX/W^X memory protections on modern systems unless deliberately worked around, and is a technique overwhelmingly associated with malware and exploit shellcode rather than legitimate software engineering.

## Bad

```asm
# x86-64 AT&T - patches its own immediate operand at runtime
.global apply_patch
apply_patch:
    mov  %rdi, patch_target+1(%rip)
patch_target:
    add  $0, %rax
    ret
```

## Good

```asm
# x86-64 AT&T - the value is passed as data, never patched into the instruction stream
.global apply_offset
apply_offset:
    mov  %rdi, %rax
    add  %rsi, %rax
    ret
```

## What Happens on a Modern, NX-Enforced System

```asm
# x86-64 AT&T - attempting to write to a page that's also mapped executable and non-writable
.section .text
.global patch_target
patch_target:
    mov  $0, %rax        # this immediate is the intended patch target
    ret

.global try_patch
try_patch:
    mov  %rdi, patch_target+1(%rip)   # SIGSEGV on a typical W^X-enforced .text section:
    ret                                  # .text is read+execute, NOT writable, by design
```

On systems enforcing W^X (write XOR execute) for the `.text` section — the default on essentially every modern OS — this doesn't just run slowly, it crashes immediately with a segmentation fault, because the memory holding the instruction stream is not writable at all.

## If Runtime Code Generation Is a Genuine Requirement

The correct pattern is a dedicated, explicitly-managed memory region that transitions between writable and executable states, never both simultaneously, and never overlapping with code currently being executed:

```c
/* C - the correct JIT pattern: write to a fresh RW mapping, then flip it to RX before ever executing it */
void *code = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
memcpy(code, generated_instructions, size);
mprotect(code, size, PROT_READ | PROT_EXEC);
```

## See Also

- [perf-avoid-self-modifying-code](perf-avoid-self-modifying-code.md) - The performance angle on this same anti-pattern
- [safe-nx-stack-no-exec](safe-nx-stack-no-exec.md) - The security mitigation this anti-pattern runs afoul of
- [proj-avoid-vendoring-generated-asm](proj-avoid-vendoring-generated-asm.md) - A different "don't patch generated output" discipline
- [lint-checksec-binary](lint-checksec-binary.md) - Verifying NX/W^X enforcement on the shipped binary
