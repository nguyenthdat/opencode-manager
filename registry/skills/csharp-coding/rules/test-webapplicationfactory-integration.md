# test-webapplicationfactory-integration

> Use `WebApplicationFactory<T>` for ASP.NET Core integration tests that exercise the real request pipeline

## Why It Matters

Unit tests with mocked dependencies don't catch routing mistakes, middleware ordering bugs, model binding issues, or DI registration problems - all of which only show up when the actual ASP.NET Core pipeline runs. `WebApplicationFactory<T>` spins up your app in-memory (no real network port needed) and gives you an `HttpClient` that exercises the real pipeline end-to-end.

## Bad

```csharp
// Testing only the controller action in isolation misses routing, middleware,
// filters, model binding, and DI wiring entirely.
[Fact]
public void GetOrder_ReturnsOrder()
{
    var controller = new OrdersController(Substitute.For<IOrderRepository>());
    var result = controller.Get(1);
    Assert.IsType<OkObjectResult>(result);
}
```

## Good

```csharp
public class OrdersApiTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetOrder_ReturnsOkWithOrder()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/orders/1");

        response.EnsureSuccessStatusCode();
        var order = await response.Content.ReadFromJsonAsync<OrderDto>();
        Assert.Equal(1, order!.Id);
    }
}
```

## Overriding Services for Tests (e.g. a Test Database)

```csharp
public class OrdersApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OrdersApiTests(WebApplicationFactory<Program> factory)
    {
        var customized = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IOrderRepository>();
                services.AddSingleton<IOrderRepository, InMemoryOrderRepository>();
            });
        });

        _client = customized.CreateClient();
    }
}
```

## Requires exposing the entry point via a partial Program class (top-level statements)

```csharp
// Program.cs (top-level statement style apps need this one line to be testable)
public partial class Program { } // allows WebApplicationFactory<Program> to reference it
```

## See Also

- [test-testcontainers-integration](test-testcontainers-integration.md) - Real external dependencies alongside this pattern
- [test-collection-fixture](test-collection-fixture.md) - Sharing expensive fixtures across test classes
