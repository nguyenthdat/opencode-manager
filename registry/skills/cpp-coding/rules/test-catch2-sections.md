# test-catch2-sections

> Use Catch2 `SECTION` for given/when/then tests

## Why It Matters

Catch2's `SECTION` lets a single `TEST_CASE` share common setup while branching into independent scenarios, each re-running the setup fresh — without the boilerplate of a class-based fixture, and with clear given/when/then-style readability for behavior-driven tests.

## Bad — Duplicated Setup Across Independent `TEST_CASE`s

```cpp
TEST_CASE("Stack push increases size") {
    Stack<int> s;
    s.push(1);
    REQUIRE(s.size() == 1);
}

TEST_CASE("Stack pop decreases size") {
    Stack<int> s;
    s.push(1);       // Setup duplicated
    s.pop();
    REQUIRE(s.size() == 0);
}
```

## Good

```cpp
TEST_CASE("Stack behavior", "[stack]") {
    Stack<int> s;
    s.push(1);   // Runs fresh before EVERY section below

    SECTION("push increases size") {
        s.push(2);
        REQUIRE(s.size() == 2);
    }

    SECTION("pop decreases size") {
        s.pop();
        REQUIRE(s.size() == 0);
    }

    SECTION("top returns the last pushed value") {
        REQUIRE(s.top() == 1);
    }
}
```

## Nested Sections for Given/When/Then

```cpp
TEST_CASE("bank account transfer", "[account]") {
    Account from(100);
    Account to(0);

    SECTION("when transferring a valid amount") {
        transfer(from, to, 50);

        SECTION("then the sender's balance decreases") {
            REQUIRE(from.balance() == 50);
        }
        SECTION("then the receiver's balance increases") {
            REQUIRE(to.balance() == 50);
        }
    }
}
```

## See Also

- [test-gtest-fixtures](test-gtest-fixtures.md) - The GoogleTest equivalent fixture pattern
- [test-arrange-act-assert](test-arrange-act-assert.md) - The general test-structuring principle
- [test-parameterized-tests](test-parameterized-tests.md) - `GENERATE` for data-driven Catch2 tests
