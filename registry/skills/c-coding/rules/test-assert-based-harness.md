# test-assert-based-harness

> For small projects, a minimal `assert`-based test harness is an acceptable, honest alternative to a full framework, as long as it reports aggregate results

## Why It Matters

Not every C project justifies pulling in a testing framework dependency. A small, self-contained harness built on `assert` (or a simple custom macro) can be entirely sufficient, provided it still gives you the two things that matter: a clear pass/fail signal per test and an aggregate summary, so failures are visible in CI output rather than silently swallowed.

## Bad

```c
int main(void) {
    assert(add(2, 3) == 5);     /* if this fails, the whole test binary aborts here — no summary,
                                  * no indication of how many other tests would have passed */
    assert(add(-1, 1) == 0);
    return 0;
}
```

## Good

```c
#include <stdio.h>

static int tests_run = 0;
static int tests_failed = 0;

#define TEST_CHECK(cond, name) do {                          \
    tests_run++;                                                \
    if (!(cond)) {                                               \
        tests_failed++;                                            \
        fprintf(stderr, "FAIL: %s (%s:%d)\n", name, __FILE__, __LINE__); \
    }                                                             \
} while (0)

static void test_add(void) {
    TEST_CHECK(add(2, 3) == 5, "add positive numbers");
    TEST_CHECK(add(-1, 1) == 0, "add cancels out");
}

int main(void) {
    test_add();
    printf("%d/%d tests passed\n", tests_run - tests_failed, tests_run);
    return tests_failed ? 1 : 0;   /* non-zero exit code fails CI */
}
```

## When to Graduate to a Real Framework

Once you need mocking, parameterized tests, or test discovery across many files, adopt Unity/Check/CMocka instead of continuing to extend a homegrown harness.

## See Also

- [test-unit-test-framework](test-unit-test-framework.md) - The framework-based alternative
- [test-descriptive-test-names](test-descriptive-test-names.md) - Naming individual checks clearly
- [test-arrange-act-assert-c](test-arrange-act-assert-c.md) - Structuring each test's body
