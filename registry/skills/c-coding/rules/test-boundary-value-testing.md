# test-boundary-value-testing

> Write explicit tests for boundary values — zero, one, the maximum, the minimum, empty, and off-by-one neighbors — not just "typical" inputs

## Why It Matters

Most C bugs (off-by-one loop errors, integer overflow, empty-buffer edge cases, `NULL`-vs-empty distinctions) cluster at boundaries, not in the middle of the input space. A test suite that only exercises "normal" values will pass cleanly while still hiding exactly the bugs most likely to occur in production, on real inputs that happen to sit at those edges.

## Bad

```c
void test_clamp(void) {
    assert(clamp(50, 0, 100) == 50);   /* only tests a comfortably mid-range value */
}
```

## Good

```c
void test_clamp_within_range_unchanged(void) {
    assert(clamp(50, 0, 100) == 50);
}
void test_clamp_below_min_returns_min(void) {
    assert(clamp(-10, 0, 100) == 0);
}
void test_clamp_above_max_returns_max(void) {
    assert(clamp(150, 0, 100) == 100);
}
void test_clamp_at_exact_min_boundary(void) {
    assert(clamp(0, 0, 100) == 0);
}
void test_clamp_at_exact_max_boundary(void) {
    assert(clamp(100, 0, 100) == 100);
}
void test_clamp_min_equals_max(void) {
    assert(clamp(5, 10, 10) == 10);
}
```

## Boundary Categories Worth Checking Systematically

| Category | Example |
|----------|---------|
| Empty input | `""`, zero-length buffer, empty list |
| Single element | One-character string, one-item array |
| Exact limits | `INT_MAX`, `INT_MIN`, buffer's exact capacity |
| Off-by-one neighbors | capacity - 1, capacity, capacity + 1 |
| NULL vs empty | `NULL` pointer vs a valid pointer to zero-length data |

## See Also

- [test-arrange-act-assert-c](test-arrange-act-assert-c.md) - Structuring each boundary case as its own test
- [ub-out-of-bounds-access](ub-out-of-bounds-access.md) - The bug class boundary tests catch most often
- [test-fuzz-entry-point](test-fuzz-entry-point.md) - Automated discovery of boundaries you didn't think to test
