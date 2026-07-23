# safe-division-by-zero-check

> Check the divisor against zero before executing `div`/`idiv` (x86), since a zero divisor triggers a fault, not a defined result

## Why It Matters

Unlike floating-point division (which produces a well-defined infinity or NaN for a zero divisor per IEEE 754), integer division by zero on x86 raises a `#DE` (divide error) fault that terminates the program (typically delivered as SIGFPE on Linux) unless something upstream has already validated the divisor. Skipping this check turns an otherwise-recoverable input-validation error into an unhandled crash.

## Bad

```asm
# x86-64 AT&T - no check before dividing; a caller-supplied zero divisor crashes the program
.global divide_wrong
divide_wrong:
    # int64_t divide_wrong(int64_t a, int64_t b) { return a / b; }
    cqo                    # sign-extend rax into rdx:rax before idiv
    idiv %rsi              # BUG: if rsi == 0, this raises #DE (SIGFPE), not a graceful error
    ret
```

## Good

```asm
# x86-64 AT&T - explicit check, with a defined error path instead of a fault
.global divide
divide:
    test %rsi, %rsi
    jz   .div_by_zero
    cqo
    idiv %rsi
    ret
.div_by_zero:
    mov  $0x8000000000000000, %rax   # illustrative sentinel/error value; define your own convention
    ret
```

## The Same Applies to the Signed-Overflow Divide Case

x86's `idiv` also faults on `INT64_MIN / -1` (the mathematical result overflows the representable range) — a second edge case worth checking alongside the zero-divisor case for fully robust division:

```asm
# x86-64 AT&T - additionally guard against the INT64_MIN / -1 overflow case
.global divide_safe
divide_safe:
    test %rsi, %rsi
    jz   .div_by_zero
    cmp  $-1, %rsi
    jne  .safe_to_divide
    cmp  $0x8000000000000000, %rdi
    je   .overflow_case
.safe_to_divide:
    cqo
    idiv %rsi
    ret
.div_by_zero:
.overflow_case:
    mov  $0x8000000000000000, %rax
    ret
```

## See Also

- [safe-signed-division-truncation](safe-signed-division-truncation.md) - The correct sign-extension step (cqo/cdq) before signed division
- [safe-integer-overflow-manual](safe-integer-overflow-manual.md) - The related overflow-checking discipline
- [test-unit-test-known-vectors](test-unit-test-known-vectors.md) - Testing this exact boundary case
