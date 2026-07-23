# lint-undefined-behavior-sanitizer

> Build and run tests with UndefinedBehaviorSanitizer (`-fsanitize=undefined`) to catch signed overflow, misaligned access, invalid casts, and other UB at runtime

## Why It Matters

Most undefined behavior compiles cleanly and often "appears to work" under a given compiler and optimization level — until a different compiler, a different optimization level, or a future compiler version exploits the UB differently. UBSan inserts runtime checks for a wide range of UB categories (signed overflow, shift-by-invalid-amount, null-pointer arithmetic, misaligned access, invalid enum values) and reports the exact source location the instant one occurs.

## Bad

```sh
cc -O2 -o test_bin test.c src/*.c   # UB may silently "work" at this optimization level and compiler version
```

## Good

```sh
cc -g -O1 -fsanitize=undefined -fno-sanitize-recover=undefined \
   -o test_bin test.c src/*.c
UBSAN_OPTIONS=print_stacktrace=1:halt_on_error=1 ./test_bin
```

## Example Output

```
parser.c:88:12: runtime error: signed integer overflow:
2147483647 + 1 cannot be represented in type 'int'
```

## Combine With AddressSanitizer for a Strong Default CI Configuration

```sh
cc -g -O1 -fsanitize=address,undefined -fno-omit-frame-pointer \
   -o test_bin test.c src/*.c
```

## fno-sanitize-recover Matters for CI

By default, UBSan reports an error and continues execution, potentially masking or duplicating findings. `-fno-sanitize-recover=undefined` makes it abort on the first detected UB, which is usually what you want in a CI test run.

## See Also

- [lint-address-sanitizer](lint-address-sanitizer.md) - Frequently combined in the same build
- [ub-signed-integer-overflow](ub-signed-integer-overflow.md) - One of many UB categories this tool detects
- [test-sanitizers-in-test-ci](test-sanitizers-in-test-ci.md) - Wiring both sanitizers into CI together
