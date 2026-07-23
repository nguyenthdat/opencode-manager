# test-c-harness-wrapper

> Test hand-written asm routines by calling them from a small, ordinary C test program, exercised with a standard test framework

## Why It Matters

Asm code has no unit-testing framework of its own; the practical way to verify it is to call it exactly the way real production code will (through its C-callable ABI boundary), using familiar C/C++ testing tools. This also naturally exercises the calling-convention contract itself — if the asm gets an argument register or return convention wrong, a C-level test catches it immediately as a wrong answer, without needing to inspect registers by hand.

## Bad (No Test Coverage at All)

```
src/
  checksum.s      # shipped with no test coverage whatsoever
```

## Good

```c
/* test_checksum.c - minimal C harness calling the asm routine like any other function */
#include <assert.h>
#include <stdio.h>
#include "checksum.h"

static void test_empty_buffer(void) {
    assert(compute_checksum(NULL, 0) == 0);
}

static void test_known_vector(void) {
    uint8_t data[] = {1, 2, 3, 4};
    assert(compute_checksum(data, sizeof(data)) == 10);
}

int main(void) {
    test_empty_buffer();
    test_known_vector();
    printf("all tests passed\n");
    return 0;
}
```

```makefile
# Makefile - building and running the test harness
test: test_checksum
	./test_checksum

test_checksum: test_checksum.c checksum.o
	$(CC) -o $@ test_checksum.c checksum.o
```

## Using a Real Test Framework Instead of Hand-Rolled asserts

```c
/* test_checksum.c - using a C test framework (e.g. Unity, Criterion, or CMocka) for structure */
#include <criterion/criterion.h>
#include "checksum.h"

Test(checksum, empty_buffer) {
    cr_assert_eq(compute_checksum(NULL, 0), 0);
}

Test(checksum, known_vector) {
    uint8_t data[] = {1, 2, 3, 4};
    cr_assert_eq(compute_checksum(data, sizeof(data)), 10);
}
```

## See Also

- [test-unit-test-known-vectors](test-unit-test-known-vectors.md) - What test cases to include
- [interop-c-callable-wrapper](interop-c-callable-wrapper.md) - The ABI boundary this harness exercises
- [test-sanitizer-wrapper](test-sanitizer-wrapper.md) - Running this same harness under a sanitizer
