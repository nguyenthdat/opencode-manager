# test-sanitizer-ci

> Run sanitizer builds as part of the test suite

## Why It Matters

Memory-safety and concurrency bugs frequently pass ordinary tests without any visible symptom — they corrupt memory or race silently, and the test happens not to observe the corrupted value this time. Running the exact same test suite under ASan/UBSan/TSan turns these into hard failures with an exact stack trace, at the point the bug actually occurs.

## Bad

```yaml
# CI only ever runs the plain, unsanitized test build — memory-safety and
# concurrency bugs ship to production undetected until they cause a crash
# under unrelated conditions much later.
test:
  script:
    - cmake -B build && cmake --build build
    - ctest --test-dir build
```

## Good

```yaml
test:
  script:
    - cmake -B build && cmake --build build
    - ctest --test-dir build

test-asan-ubsan:
  script:
    - cmake -B build-asan -DENABLE_SANITIZERS=ON -DCMAKE_BUILD_TYPE=RelWithDebInfo
    - cmake --build build-asan
    - ctest --test-dir build-asan

test-tsan:
  script:
    - cmake -B build-tsan -DENABLE_TSAN=ON -DCMAKE_BUILD_TYPE=RelWithDebInfo
    - cmake --build build-tsan
    - ctest --test-dir build-tsan
```

## Treat Sanitizer Failures as Blocking, Not Optional

```bash
# A sanitizer failure indicates a genuine memory-safety or concurrency bug —
# it should block merges exactly like a normal test failure, not be treated
# as an informational-only or "nice to have someday" signal.
```

## See Also

- [mem-sanitizer-required](mem-sanitizer-required.md) - Sanitizer setup and coverage in depth
- [lint-address-sanitizer](lint-address-sanitizer.md) - ASan-specific CI configuration
- [lint-thread-sanitizer](lint-thread-sanitizer.md) - TSan-specific CI configuration
