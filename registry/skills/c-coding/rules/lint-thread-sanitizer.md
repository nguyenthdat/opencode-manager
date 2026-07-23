# lint-thread-sanitizer

> Build and run multi-threaded test suites with ThreadSanitizer (`-fsanitize=thread`) to detect data races directly

## Why It Matters

Data races are notoriously hard to reproduce through manual testing — a race might only manifest under specific timing that occurs one time in a million runs. ThreadSanitizer instruments every shared-memory access and lock operation, detecting a race the moment two unsynchronized accesses to the same memory (with at least one write) occur, regardless of whether the specific run happened to produce an observably wrong result.

## Bad

```sh
cc -pthread -O2 -o test_bin test.c src/*.c   # no race detection: races may pass silently for months
./test_bin
```

## Good

```sh
cc -pthread -g -O1 -fsanitize=thread -o test_bin test.c src/*.c
./test_bin
```

## Example Output

```
==================
WARNING: ThreadSanitizer: data race (pid=12345)
  Write of size 4 at 0x... by thread T1:
    #0 worker counter.c:10

  Previous write of size 4 at 0x... by thread T2:
    #0 worker counter.c:10

  Location is global 'counter' of size 4 at 0x...
==================
```

## Cannot Combine With ASan/UBSan in One Binary

TSan is generally incompatible with ASan/UBSan in the same build; run it as a separate CI job/matrix leg specifically for the multi-threaded test suite.

## Reduced False Negatives Requires Actually Exercising the Race

TSan can only detect a race that occurs during the instrumented run — it doesn't prove the absence of races the way a static race detector attempts to. Combine it with stress-testing (running the concurrent test many times, under load) to maximize the chance of triggering a rare race.

## See Also

- [conc-avoid-data-races](conc-avoid-data-races.md) - The hazard this tool detects directly
- [lint-address-sanitizer](lint-address-sanitizer.md) - Run as a separate matrix leg, not combined with TSan
- [test-ci-matrix-compilers](test-ci-matrix-compilers.md) - Structuring CI to run TSan as its own job
