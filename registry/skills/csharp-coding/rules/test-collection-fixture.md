# test-collection-fixture

> Use `IClassFixture<T>`/`ICollectionFixture<T>` to share expensive setup safely across tests

## Why It Matters

Some setup (spinning up a test database container, seeding shared reference data) is too expensive to redo for every single test method. `IClassFixture<T>` shares one instance across all tests in a class; `ICollectionFixture<T>` extends that sharing across multiple test classes - both with explicit, documented lifetime management instead of an ad-hoc static field (see `test-avoid-shared-mutable-state`).

## Bad

```csharp
public class OrderRepositoryTests
{
    private static SqliteConnection? _connection; // ad-hoc, unclear lifetime/ownership

    public OrderRepositoryTests()
    {
        _connection ??= new SqliteConnection("Data Source=:memory:");
        _connection.Open(); // may already be open from a previous test - error-prone
    }
}
```

## Good: IClassFixture (Shared Within One Test Class)

```csharp
public class DatabaseFixture : IDisposable
{
    public SqliteConnection Connection { get; }

    public DatabaseFixture()
    {
        Connection = new SqliteConnection("Data Source=:memory:");
        Connection.Open();
        // ... run migrations, seed data once ...
    }

    public void Dispose() => Connection.Dispose();
}

public class OrderRepositoryTests(DatabaseFixture fixture) : IClassFixture<DatabaseFixture>
{
    [Fact]
    public void Add_PersistsOrder()
    {
        var repository = new OrderRepository(fixture.Connection);
        repository.Add(new Order());
        Assert.Single(repository.GetAll());
    }
}
```

## ICollectionFixture (Shared Across Multiple Test Classes)

```csharp
[CollectionDefinition("Database collection")]
public class DatabaseCollection : ICollectionFixture<DatabaseFixture>;

[Collection("Database collection")]
public class OrderRepositoryTests(DatabaseFixture fixture)
{
    // shares the SAME DatabaseFixture instance with every other class
    // decorated with [Collection("Database collection")]
}

[Collection("Database collection")]
public class InvoiceRepositoryTests(DatabaseFixture fixture)
{
    // ...
}
```

## Isolating Data Between Tests Sharing a Fixture

```csharp
// Even with a shared connection/container, each test should still clean up or
// use a transaction-per-test rollback strategy so tests don't interfere with
// each other's DATA, even while sharing the expensive CONNECTION setup.
[Fact]
public void Add_PersistsOrder()
{
    using var transaction = fixture.Connection.BeginTransaction();
    // ... test logic using the transaction ...
    // transaction is rolled back (not committed) at the end, isolating this test's data
}
```

## See Also

- [test-avoid-shared-mutable-state](test-avoid-shared-mutable-state.md) - The problem this pattern solves correctly
- [test-testcontainers-integration](test-testcontainers-integration.md) - Real external dependencies as fixtures
- [test-webapplicationfactory-integration](test-webapplicationfactory-integration.md) - Another fixture-based pattern
