# test-no-shared-mutable-fixture

> Avoid shared mutable state between tests

## Why It Matters

Tests that share mutable state (a global, a static member, a singleton, a shared temp file) can pass or fail depending on execution order or which tests ran before them — this makes failures non-reproducible in isolation and breaks parallel/sharded test execution, which most modern test runners use by default.

## Bad

```cpp
std::vector<int>& shared_state() {
    static std::vector<int> data;   // Shared across every test in the binary
    return data;
}

TEST(QueueTest, PushAddsItem) {
    shared_state().push_back(1);
    EXPECT_EQ(shared_state().size(), 1);   // Passes only if run first/in isolation
}

TEST(QueueTest, ClearEmptiesQueue) {
    shared_state().clear();
    EXPECT_TRUE(shared_state().empty());   // Passes regardless — but silently
}                                             // depends on execution order elsewhere
```

## Good

```cpp
class QueueTest : public ::testing::Test {
protected:
    std::vector<int> data_;   // Fresh instance per test; no cross-test leakage
};

TEST_F(QueueTest, PushAddsItem) {
    data_.push_back(1);
    EXPECT_EQ(data_.size(), 1);
}

TEST_F(QueueTest, ClearEmptiesQueue) {
    data_.push_back(1);
    data_.clear();
    EXPECT_TRUE(data_.empty());
}
```

## Filesystem/Database State Needs the Same Discipline

```cpp
class FileTest : public ::testing::Test {
protected:
    void SetUp() override {
        temp_dir_ = create_unique_temp_dir();   // Unique per test, not a shared fixed path
    }
    void TearDown() override {
        remove_directory(temp_dir_);   // Cleaned up regardless of pass/fail
    }
    std::filesystem::path temp_dir_;
};
```

## See Also

- [test-gtest-fixtures](test-gtest-fixtures.md) - Fixtures that create fresh, isolated state per test
- [conc-avoid-data-races](conc-avoid-data-races.md) - Shared mutable state hazards apply to test parallelism too
- [anti-global-mutable-state](anti-global-mutable-state.md) - The broader anti-pattern this rule guards against in tests
