# api-builder-fluent

> Use a fluent builder for complex, multi-step object construction with optional/conditional parts

## Why It Matters

A constructor or object initializer with a dozen optional parameters becomes unreadable and error-prone (are these bools in the right order?). A fluent builder makes each configuration step self-describing, supports conditional/looped configuration cleanly, and can validate the final result in one place before producing an immutable object.

## Bad

```csharp
var request = new HttpRequestConfig(
    "https://api.example.com", "GET", true, false, 30, null, true, "gzip");
// What do `true, false, 30, null, true` mean without checking the signature?
```

## Good

```csharp
public sealed class HttpRequestConfigBuilder
{
    private string _url = "";
    private string _method = "GET";
    private TimeSpan _timeout = TimeSpan.FromSeconds(30);
    private readonly Dictionary<string, string> _headers = [];

    public HttpRequestConfigBuilder WithUrl(string url)
    {
        _url = url;
        return this;
    }

    public HttpRequestConfigBuilder WithMethod(string method)
    {
        _method = method;
        return this;
    }

    public HttpRequestConfigBuilder WithTimeout(TimeSpan timeout)
    {
        _timeout = timeout;
        return this;
    }

    public HttpRequestConfigBuilder WithHeader(string name, string value)
    {
        _headers[name] = value;
        return this;
    }

    public HttpRequestConfig Build()
    {
        if (string.IsNullOrWhiteSpace(_url))
        {
            throw new InvalidOperationException("Url must be set before building.");
        }
        return new HttpRequestConfig(_url, _method, _timeout, _headers.ToImmutableDictionary());
    }
}

var config = new HttpRequestConfigBuilder()
    .WithUrl("https://api.example.com")
    .WithMethod("POST")
    .WithTimeout(TimeSpan.FromSeconds(10))
    .WithHeader("Accept-Encoding", "gzip")
    .Build();
```

## When a Builder Is Overkill

```csharp
// A handful of optional values with clear names is better served by an
// object initializer / `required` properties, not a builder - see
// api-optional-parameters-vs-overloads and api-required-members.
var simple = new HttpRequestConfig { Url = "https://api.example.com", Method = "POST" };
```

## See Also

- [api-optional-parameters-vs-overloads](api-optional-parameters-vs-overloads.md) - The simpler alternative
- [api-required-members](api-required-members.md) - Enforcing mandatory fields without a builder
- [api-static-factory-methods](api-static-factory-methods.md) - Another construction-with-validation pattern
