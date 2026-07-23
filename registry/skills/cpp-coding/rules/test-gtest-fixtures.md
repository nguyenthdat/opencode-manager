# test-gtest-fixtures

> Use GoogleTest fixtures (`TEST_F`) for shared setup

## Why It Matters

`TEST_F` fixtures centralize common setup/teardown logic in `SetUp()`/`TearDown()` (or the constructor/destructor), avoiding duplicated boilerplate across every test case and ensuring each test gets a fresh, isolated instance of shared test state.

## Bad

```cpp
TEST(WidgetTest, RendersCorrectly) {
    auto renderer = std::make_unique<Renderer>();
    renderer->initialize(800, 600);   // Duplicated setup...
    Widget w;
    EXPECT_TRUE(renderer->render(w));
}

TEST(WidgetTest, HandlesResize) {
    auto renderer = std::make_unique<Renderer>();
    renderer->initialize(800, 600);   // ...in every single test
    renderer->resize(1024, 768);
    EXPECT_EQ(renderer->width(), 1024);
}
```

## Good

```cpp
class WidgetTest : public ::testing::Test {
protected:
    void SetUp() override {
        renderer_ = std::make_unique<Renderer>();
        renderer_->initialize(800, 600);
    }
    // TearDown() override if explicit cleanup beyond destructors is needed

    std::unique_ptr<Renderer> renderer_;
};

TEST_F(WidgetTest, RendersCorrectly) {
    Widget w;
    EXPECT_TRUE(renderer_->render(w));
}

TEST_F(WidgetTest, HandlesResize) {
    renderer_->resize(1024, 768);
    EXPECT_EQ(renderer_->width(), 1024);
}
```

## Each Test Gets a Fresh Fixture Instance

```cpp
// GoogleTest constructs a NEW WidgetTest instance for every TEST_F, so
// renderer_ from one test never leaks state into another — no manual reset needed.
```

## See Also

- [test-arrange-act-assert](test-arrange-act-assert.md) - Structuring the test body itself
- [test-no-shared-mutable-fixture](test-no-shared-mutable-fixture.md) - Avoiding shared state across fixture instances
- [test-parameterized-tests](test-parameterized-tests.md) - `TEST_P` for running the same fixture with varied inputs
