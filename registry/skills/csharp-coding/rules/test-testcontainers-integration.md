# test-testcontainers-integration

> Use Testcontainers for integration tests against real dependencies (databases, message brokers) instead of hand-rolled Docker scripts or shared test environments

## Why It Matters

An in-memory database fake (or mocked repository) doesn't catch real SQL dialect issues, real transaction/isolation-level behavior, or provider-specific quirks. A shared, long-lived test database causes cross-test/cross-developer interference. Testcontainers spins up a real, disposable container (Postgres, Kafka, Redis, etc.) per test run, wired into your test's lifecycle automatically.

## Bad

```csharp
// Relies on a shared, long-lived "test" database that every developer/CI job
// points at - inevitably accumulates stale data and cross-run interference.
public class OrderRepositoryTests
{
    private readonly string _connectionString = "Server=shared-test-db;Database=test;...";
}
```

## Good

```csharp
public class OrderRepositoryTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private OrderRepository _repository = null!;

    public async Task InitializeAsync()
    {
        await _container.StartAsync(); // fresh, isolated Postgres instance for this test run
        var dbContext = new AppDbContext(_container.GetConnectionString());
        await dbContext.Database.MigrateAsync();
        _repository = new OrderRepository(dbContext);
    }

    public async Task DisposeAsync() => await _container.DisposeAsync();

    [Fact]
    public async Task Add_PersistsOrder()
    {
        await _repository.AddAsync(new Order { Total = 100m });
        var orders = await _repository.GetAllAsync();
        Assert.Single(orders);
    }
}
```

## Sharing a Container Across a Test Class (Not Recreating Per Test)

```csharp
// Combine with test-collection-fixture to start ONE container per test class
// (or collection), rather than per test method, when startup cost matters.
public class DatabaseFixture : IAsyncLifetime
{
    public PostgreSqlContainer Container { get; } = new PostgreSqlBuilder().Build();

    public Task InitializeAsync() => Container.StartAsync();
    public Task DisposeAsync() => Container.DisposeAsync().AsTask();
}
```

## CI Considerations

```text
Testcontainers requires a Docker daemon available in the CI environment -
most hosted CI providers (GitHub Actions, GitLab CI, Azure Pipelines) support
this natively via "Docker-in-Docker" or a Docker socket mount.
```

## See Also

- [test-collection-fixture](test-collection-fixture.md) - Sharing container startup cost across tests
- [test-webapplicationfactory-integration](test-webapplicationfactory-integration.md) - Combining with full-pipeline integration tests
