# test-sanitizers-in-test-ci

> Run the full test suite under AddressSanitizer and UndefinedBehaviorSanitizer on every CI build, not just occasionally by hand

## Why It Matters

Memory-safety and undefined-behavior bugs frequently don't manifest as test failures under normal execution — the test may pass while quietly reading one byte past a buffer or triggering signed overflow. Sanitizers instrument the binary to detect these conditions the instant they occur, turning invisible latent bugs into loud, precisely-located CI failures, which is far cheaper than debugging the same issue after it surfaces in production.

## Bad

```yaml
# CI only builds and runs tests with default flags — sanitizers never enabled
- run: cc -O2 -o test_bin test.c src/*.c
- run: ./test_bin
```

## Good

```yaml
# .github/workflows/ci.yml (excerpt)
- name: Build with sanitizers
  run: |
    cc -g -O1 -fsanitize=address,undefined -fno-omit-frame-pointer \
       -o test_bin test.c src/*.c
- name: Run tests under ASan+UBSan
  run: ./test_bin
  env:
    ASAN_OPTIONS: detect_leaks=1:abort_on_error=1
    UBSAN_OPTIONS: print_stacktrace=1:halt_on_error=1
```

## Run a Separate Matrix Leg for ThreadSanitizer

```yaml
- name: Build with ThreadSanitizer
  run: cc -g -O1 -fsanitize=thread -o test_bin_tsan test.c src/*.c
- name: Run tests under TSan
  run: ./test_bin_tsan
```

ASan/UBSan and TSan are generally not combinable in one binary; run them as separate CI jobs/matrix legs.

## See Also

- [lint-address-sanitizer](lint-address-sanitizer.md) - ASan configuration details
- [lint-undefined-behavior-sanitizer](lint-undefined-behavior-sanitizer.md) - UBSan configuration details
- [lint-thread-sanitizer](lint-thread-sanitizer.md) - TSan configuration details
