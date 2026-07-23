# interop-callback-function-pointers

> Call a C function pointer from asm exactly as the ABI's calling convention requires — never assume its calling convention from context

## Why It Matters

A function pointer passed into asm carries no compile-time information about its calling convention; asm code invoking it must independently know and honor the platform's standard convention (arguments in the right registers, correct stack alignment before the call, correct handling of the return value) exactly as if it were calling a statically known function, since the CPU has no way to check this at runtime.

## Bad

```asm
# x86-64 AT&T (SysV) - calls the function pointer without ensuring 16-byte stack alignment first
.global invoke_callback_wrong
invoke_callback_wrong:
    # void invoke_callback_wrong(void (*cb)(int), int arg)
    # rdi = cb, rsi = arg
    push %rbx                # BUG: odd number of pushes before the call below
    mov  %rdi, %rbx
    mov  %rsi, %edi            # move arg into position for the callback
    call *%rbx                  # stack may not be 16-byte aligned here
    pop  %rbx
    ret
```

## Good

```asm
# x86-64 AT&T (SysV) - stack alignment maintained before the indirect call
.global invoke_callback
invoke_callback:
    push %rbx
    push %rbx              # padding push to preserve 16-byte alignment (2 pushes = 16 bytes)
    mov  %rdi, %rbx
    mov  %rsi, %edi
    call *%rbx
    pop  %rbx
    pop  %rbx
    ret
```

## Passing Additional Context to the Callback

If the callback expects extra arguments (e.g. a user-data pointer), place them in the correct subsequent argument registers exactly as a normal call would, before the indirect `call`:

```asm
# x86-64 AT&T - callback with signature void (*cb)(int arg, void *user_data)
mov %r12, %rsi    # user_data into the 2nd argument register
mov %r13d, %edi    # arg into the 1st argument register
call *%rbx           # invoke the function pointer held in rbx
```

## ARM64 Equivalent

```asm
// ARM64 - indirect call via blr, same alignment/argument rules as a direct call
.global invoke_callback
invoke_callback:
    // x0 = cb, x1 = arg
    mov x9, x0     // move function pointer out of the argument register first
    mov x0, x1       // now set up the actual argument for the callback
    blr x9            // branch with link, register-indirect
    ret
```

## See Also

- [abi-stack-alignment-call](abi-stack-alignment-call.md) - The alignment requirement this depends on
- [interop-c-callable-wrapper](interop-c-callable-wrapper.md) - Ensuring the callback signature itself is ABI-correct
- [abi-sysv-amd64-args](abi-sysv-amd64-args.md) - The argument convention being followed here
