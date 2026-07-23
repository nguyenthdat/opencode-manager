# di-httpclientfactory

> Use `IHttpClientFactory` instead of `new HttpClient()` per call or a single shared static instance

## Why It Matters

Creating a new `HttpClient` per request exhausts OS sockets under load because each instance owns its own connection pool and disposing it doesn't immediately release the underlying TCP connections (they linger in `TIME_WAIT`). A single long-lived static `HttpClient`, on the other hand, never picks up DNS changes because it caches DNS resolution for the lifetime of the underlying connection. `IHttpClientFactory` solves both problems by pooling and rotating `HttpMessageHandler` instances correctly.

## Bad

```csharp
public class WeatherClient
{
    public async Task<Weather> GetAsync(string city)
    {
        using var client = new HttpClient(); // new connection pool every call - exhausts sockets under load
        return await client.GetFromJsonAsync<Weather>($"/weather?city={city}")
            ?? throw new InvalidOperationException("Empty response");
    }
}

// Or the opposite mistake: a single static instance that never rotates DNS
public static class SharedClient
{
    public static readonly HttpClient Instance = new(); // never picks up DNS changes
}
```

## Good

```csharp
// Program.cs
builder.Services.AddHttpClient<WeatherClient>(client =>
{
    client.BaseAddress = new Uri("https://weather.example.com");
    client.Timeout = TimeSpan.FromSeconds(10);
});

public class WeatherClient(HttpClient client)
{
    public async Task<Weather> GetAsync(string city) =>
        await client.GetFromJsonAsync<Weather>($"/weather?city={city}")
            ?? throw new InvalidOperationException("Empty response");
}
```

## Named Clients for Multiple Configurations

```csharp
builder.Services.AddHttpClient("Payments", client =>
{
    client.BaseAddress = new Uri("https://payments.example.com");
});

public class PaymentGateway(IHttpClientFactory factory)
{
    public async Task ChargeAsync(decimal amount)
    {
        var client = factory.CreateClient("Payments");
        await client.PostAsJsonAsync("/charge", new { amount });
    }
}
```

## Adding Resilience (Polly)

```csharp
builder.Services.AddHttpClient<WeatherClient>()
    .AddStandardResilienceHandler(); // .NET 8+ Microsoft.Extensions.Http.Resilience
```

## See Also

- [async-cancellationtoken-propagate](async-cancellationtoken-propagate.md) - Cancellation for HTTP calls
- [di-constructor-injection](di-constructor-injection.md) - Injecting the typed client
