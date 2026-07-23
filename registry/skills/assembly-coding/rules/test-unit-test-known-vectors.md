# test-unit-test-known-vectors

> Test asm routines against known input/output vectors, deliberately including boundary cases: zero, the maximum representable value, negative numbers, and empty input

## Why It Matters

Hand-written asm is exactly the kind of code where boundary conditions are most likely to be wrong — an off-by-one in a loop counter, a sign-extension forgotten on the one negative input in a thousand, an empty-buffer case that dereferences a null pointer before checking the length. A test suite that only exercises "typical" inputs misses precisely the inputs most likely to expose a real bug.

## Bad (Only Happy-Path Coverage)

```c
/* test_checksum.c - only tests one, unremarkable input */
void test_basic(void) {
    uint8_t data[] = {1, 2, 3, 4};
    assert(compute_checksum(data, 4) == 10);
}
```

## Good

```c
/* test_checksum.c - covers zero, empty, max, and negative-adjacent boundary cases */
void test_empty_buffer(void) {
    assert(compute_checksum(NULL, 0) == 0);         /* empty input: no dereference of NULL */
}

void test_single_byte(void) {
    uint8_t data[] = {42};
    assert(compute_checksum(data, 1) == 42);
}

void test_all_zero_bytes(void) {
    uint8_t data[16] = {0};
    assert(compute_checksum(data, 16) == 0);
}

void test_max_byte_values(void) {
    uint8_t data[4] = {0xFF, 0xFF, 0xFF, 0xFF};
    assert(compute_checksum(data, 4) == 0xFF * 4);   /* verify no unsigned overflow bug */
}

void test_odd_length_for_simd_routine(void) {
    /* if the routine is SIMD-optimized in chunks of 4/8/16, this exercises the scalar remainder path */
    uint8_t data[] = {1, 2, 3, 4, 5};   /* 5 = one full SIMD chunk + a 1-element remainder */
    assert(compute_checksum(data, 5) == 15);
}
```

## Boundary Cases Worth Always Including

| Category | Example case |
|---|---|
| Empty/zero-length | `len == 0`, possibly with a NULL pointer |
| Single element | `len == 1` |
| SIMD chunk boundary | `len` = exactly one vector width, and one-past/one-under it |
| Signed extremes | `INT64_MIN`, `INT64_MAX`, `-1` |
| Unsigned extremes | `0`, `UINT64_MAX` |
| Alignment edge | buffer deliberately misaligned, if the routine claims to handle it |

## See Also

- [test-c-harness-wrapper](test-c-harness-wrapper.md) - The harness these test cases run inside
- [test-fuzz-via-wrapper](test-fuzz-via-wrapper.md) - Complementary randomized testing for cases you didn't think of
- [safe-integer-overflow-manual](safe-integer-overflow-manual.md) - Why overflow-adjacent inputs need explicit coverage
