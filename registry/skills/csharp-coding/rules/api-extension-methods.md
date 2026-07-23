# api-extension-methods

> Use extension methods to add behavior to types you don't own, instead of utility classes with static helper methods

## Why It Matters

Extension methods let callers use natural, fluent, discoverable syntax (`value.DoThing()`) on types you can't modify (BCL types, third-party types, sealed types), rather than forcing them to remember and call `SomeHelperClass.DoThing(value)`. They show up in IntelliSense on the extended type, improving discoverability.

## Bad

```csharp
public static class StringUtils
{
    public static bool IsNullOrBlank(string? value) =>
        value is null || value.Trim().Length == 0;
}

if (StringUtils.IsNullOrBlank(name)) // works, but reads backwards and isn't discoverable on `name.`
{
    // ...
}
```

## Good

```csharp
public static class StringExtensions
{
    public static bool IsNullOrBlank(this string? value) =>
        value is null || value.Trim().Length == 0;
}

if (name.IsNullOrBlank()) // reads naturally, shows up in IntelliSense on any string
{
    // ...
}
```

## A Realistic Domain Example

```csharp
public static class HttpResponseExtensions
{
    public static async Task<T> ReadAsJsonAsync<T>(
        this HttpResponseMessage response, CancellationToken cancellationToken = default)
    {
        response.EnsureSuccessStatusCode();
        var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return await JsonSerializer.DeserializeAsync<T>(stream, cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("Response body was null.");
    }
}

var user = await response.ReadAsJsonAsync<User>(cancellationToken);
```

## Guidance

```text
- Put extension methods in a namespace the consumer must opt into explicitly
  (e.g. YourLibrary.Extensions) rather than polluting a commonly-imported namespace.
- Don't use extension methods to bypass encapsulation of a type you DO own -
  add real instance members instead.
- Avoid extension methods with side effects that aren't obvious from the name -
  they read like pure/queryable operations to most callers.
```

## See Also

- [api-interface-segregation](api-interface-segregation.md) - Related API surface design
- [name-avoid-abbreviations](name-avoid-abbreviations.md) - Naming extension methods clearly
