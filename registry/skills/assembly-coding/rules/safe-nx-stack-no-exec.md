# safe-nx-stack-no-exec

> Never place executable code on a stack or heap region marked non-executable (NX/DEP); use a dedicated `.text` section for all code

## Why It Matters

Modern CPUs and operating systems enforce a No-eXecute (NX, also called DEP) bit on stack and (by default) heap memory pages specifically to prevent injected or self-generated code from ever running there, closing off an entire historical class of exploitation technique. Assembly that assumes it can jump into a buffer it just wrote to on the stack will fault with a segmentation violation on any modern system, and "fixing" this by disabling NX is a severe, unjustifiable security regression.

## Bad

```asm
# x86-64 AT&T - writes machine code bytes onto the stack, then attempts to execute them
.global run_from_stack_wrong
run_from_stack_wrong:
    sub  $16, %rsp
    movq $0xc3c0c48948, (%rsp)   # raw machine code bytes for a trivial instruction sequence
    call *%rsp                     # BUG: modern NX-enforced stacks fault here (SIGSEGV)
    add  $16, %rsp
    ret
```

## Good

```asm
# x86-64 AT&T - code lives in .text, exactly where the loader maps it executable
.section .text
.global trivial_function
trivial_function:
    xor %eax, %eax
    ret

.global caller
caller:
    call trivial_function     # ordinary call to code that's actually in an executable section
    ret
```

## Legitimate JIT Use Cases Handle This Explicitly

Runtime code generation (JIT compilers) is a legitimate exception, but it must explicitly allocate a dedicated, appropriately-permissioned region rather than reusing the stack or default heap:

```c
/* C - the correct pattern for runtime-generated code: separate mapping, explicit permission transition */
void *code = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
memcpy(code, generated_bytes, size);
mprotect(code, size, PROT_READ | PROT_EXEC);   /* now, and only now, executable */
```

## Verifying NX Is Enforced on a Binary

```bash
checksec --file=./my_program     # reports whether the stack is executable (it should not be)
readelf -l my_program | grep GNU_STACK   # RWE flags should NOT include 'E' for a normal binary
```

## See Also

- [perf-avoid-self-modifying-code](perf-avoid-self-modifying-code.md) - The related self-modifying-code discipline
- [lint-checksec-binary](lint-checksec-binary.md) - Verifying NX/PIE/canary flags on the shipped binary
- [syntax-section-directives](syntax-section-directives.md) - Why code belongs in .text specifically
