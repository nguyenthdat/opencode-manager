# test-unit-test-framework

> Use an established C unit-testing framework (Unity, Check, or CMocka) instead of ad hoc `printf`-based assertions

## Why It Matters

A dedicated test framework gives you structured test discovery, clear pass/fail reporting, setup/teardown hooks, and (for CMocka/Check) mocking support — all of which a hand-rolled `if (!cond) printf("FAIL\n")` harness has to reinvent poorly. Standardizing on one framework also lets contributors write tests without learning a project-specific ad hoc convention.

## Bad

```c
void test_add(void) {
    if (add(2, 3) != 5) {
        printf("FAIL: add(2,3) != 5\n");
    } else {
        printf("PASS: add(2,3)\n");
    }
}
/* No aggregate pass/fail count, no consistent output format, no setup/teardown */
```

## Good — Unity (lightweight, popular for embedded)

```c
#include "unity.h"

void setUp(void) {}      /* run before each test */
void tearDown(void) {}     /* run after each test */

void test_add_returns_sum(void) {
    TEST_ASSERT_EQUAL_INT(5, add(2, 3));
}

void test_add_handles_negatives(void) {
    TEST_ASSERT_EQUAL_INT(-1, add(2, -3));
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_add_returns_sum);
    RUN_TEST(test_add_handles_negatives);
    return UNITY_END();
}
```

## Good — CMocka (supports mocking, richer assertions)

```c
#include <stdarg.h>
#include <stddef.h>
#include <setjmp.h>
#include <cmocka.h>

static void test_add(void **state) {
    (void)state;
    assert_int_equal(add(2, 3), 5);
}

int main(void) {
    const struct CMUnitTest tests[] = {
        cmocka_unit_test(test_add),
    };
    return cmocka_run_group_tests(tests, NULL, NULL);
}
```

## See Also

- [test-assert-based-harness](test-assert-based-harness.md) - A minimal alternative when a full framework is overkill
- [test-mock-via-function-pointers](test-mock-via-function-pointers.md) - Mocking dependencies for unit tests
- [test-ci-matrix-compilers](test-ci-matrix-compilers.md) - Running the test suite across compilers/platforms
