# test-parameterized-tests

> Use parameterized tests instead of copy-pasted cases

## Why It Matters

Testing the same logic against many input/expected-output pairs by copy-pasting a near-identical `TEST`/`TEST_F` for each case duplicates the test body, making it easy for cases to drift out of sync when the logic under test changes. Parameterized tests define the test body once and supply a table of inputs, keeping the assertions in one place.

## Bad

```cpp
TEST(IsPrimeTest, TwoIsPrime) { EXPECT_TRUE(is_prime(2)); }
TEST(IsPrimeTest, ThreeIsPrime) { EXPECT_TRUE(is_prime(3)); }
TEST(IsPrimeTest, FourIsNotPrime) { EXPECT_FALSE(is_prime(4)); }
TEST(IsPrimeTest, NineIsNotPrime) { EXPECT_FALSE(is_prime(9)); }
// Copy-pasted structure repeated for every case; easy for a case to be
// forgotten or subtly inconsistent with the others.
```

## Good — GoogleTest

```cpp
struct PrimeCase { int value; bool expected; };

class IsPrimeTest : public ::testing::TestWithParam<PrimeCase> {};

TEST_P(IsPrimeTest, MatchesExpected) {
    const auto& [value, expected] = GetParam();
    EXPECT_EQ(is_prime(value), expected);
}

INSTANTIATE_TEST_SUITE_P(PrimeCases, IsPrimeTest, ::testing::Values(
    PrimeCase{2, true}, PrimeCase{3, true},
    PrimeCase{4, false}, PrimeCase{9, false}
));
```

## Good — Catch2

```cpp
TEST_CASE("is_prime classifies numbers correctly") {
    auto [value, expected] = GENERATE(table<int, bool>({
        {2, true}, {3, true}, {4, false}, {9, false}
    }));
    REQUIRE(is_prime(value) == expected);
}
```

## See Also

- [test-gtest-fixtures](test-gtest-fixtures.md) - Combining fixtures with parameterization
- [test-catch2-sections](test-catch2-sections.md) - `GENERATE` alongside `SECTION`
- [test-arrange-act-assert](test-arrange-act-assert.md) - Structuring the per-case assertion body
