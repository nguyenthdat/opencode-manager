# test-avoid-shared-mutable-state

> Avoid shared mutable state or fixtures leaking between tests; each test should be independently runnable and repeatable

## Why It Matters

Tests that share mutable state (a static field, a shared database row, a singleton service with internal state) can pass or fail depending on execution order, parallelization, and which tests ran before them - "flaky" tests that pass locally and fail in CI (or vice versa) are almost always caused by this.

## Bad

```csharp
public class OrderRepositoryTests
{
    private static readonly List<Order> SharedOrders = []; // shared across ALL test instances/runs

    [Fact]
    public void Add_IncreasesCount()
    {
        SharedOrders.Add(new Order());
        Assert.Single(SharedOrders); // passes only if no OTHER test added to SharedOrders first
    }

    [Fact]
    public void Remove_DecreasesCount()
    {
        SharedOrders.Add(new Order());
        SharedOrders.RemoveAt(0);
        Assert.Empty(SharedOrders); // fails if Add_IncreasesCount ran first and left an item behind
    }
}
```

## Good

```csharp
public class OrderRepositoryTests
{
    [Fact]
    public void Add_IncreasesCount()
    {
        var orders = new List<Order>(); // fresh, test-local state
        orders.Add(new Order());
        Assert.Single(orders);
    }

    [Fact]
    public void Remove_DecreasesCount()
    {
        var orders = new List<Order> { new Order() };
        orders.RemoveAt(0);
        Assert.Empty(orders);
    }
}
```

## xUnit Creates a Fresh Instance Per Test By Default

```csharp
// xUnit constructs a NEW instance of the test class for every [Fact]/[Theory]
// case - instance fields are naturally test-isolated already, unlike NUnit's
// default of reusing one instance per class (verify your framework's model).
public class OrderProcessorTests
{
    private readonly List<Order> _orders = []; // fresh per test in xUnit - safe by default

    [Fact]
    public void Test1() { _orders.Add(new Order()); Assert.Single(_orders); }

    [Fact]
    public void Test2() { Assert.Empty(_orders); } // always starts empty - new instance per test
}
```

## Shared, Expensive Setup: Use a Fixture, Not a Static Field

```csharp
// If setup is genuinely expensive to repeat, share it via IClassFixture/ICollectionFixture
// (see test-collection-fixture) - designed for this, with explicit lifetime management,
// rather than an uncontrolled static field.
```

## See Also

- [test-collection-fixture](test-collection-fixture.md) - The correct way to share expensive setup
- [test-avoid-testing-private](test-avoid-testing-private.md) - Related test-isolation discipline
