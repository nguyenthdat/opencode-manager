# proj-internalsvisibleto-tests

> Use `InternalsVisibleTo` to expose `internal` members to test assemblies, instead of making them `public`

## Why It Matters

Making a member `public` purely so a test project can reach it leaks an implementation detail into your permanent public API surface. `InternalsVisibleTo` grants a specific, named assembly (your test project - and only your test project) access to `internal` members, keeping the actual public API surface exactly as intentional as it should be.

## Bad

```csharp
// Made public ONLY so OrderProcessorTests can call it - now it's part of the
// permanent public API surface, forever, for every consumer of this library.
public class OrderValidationHelper
{
    public bool CheckTotal(Order order) => order.Total > 0;
}
```

## Good

```csharp
// MySolution.Domain.csproj
```

```xml
<ItemGroup>
  <InternalsVisibleTo Include="MySolution.Domain.Tests" />
</ItemGroup>
```

```csharp
internal class OrderValidationHelper // stays internal to the real API surface
{
    public bool CheckTotal(Order order) => order.Total > 0;
}
```

```csharp
// MySolution.Domain.Tests/OrderValidationHelperTests.cs
public class OrderValidationHelperTests
{
    [Fact]
    public void CheckTotal_ReturnsFalse_ForZeroTotal()
    {
        var helper = new OrderValidationHelper(); // accessible thanks to InternalsVisibleTo
        Assert.False(helper.CheckTotal(new Order { Total = 0 }));
    }
}
```

## Also Needed for Mocking Libraries on Internal Interfaces

```xml
<!-- Moq/NSubstitute generate a dynamic proxy assembly that also needs visibility
     into internal types/interfaces being mocked. -->
<ItemGroup>
  <InternalsVisibleTo Include="MySolution.Domain.Tests" />
  <InternalsVisibleTo Include="DynamicProxyGenAssembly2" /> <!-- Castle DynamicProxy, used by Moq -->
</ItemGroup>
```

## Centralizing via Directory.Build.props for Consistent Naming

```xml
<!-- If test projects consistently follow a "<ProjectName>.Tests" naming
     convention, this can be generated/asserted consistently across the solution. -->
```

## See Also

- [proj-internal-visibility](proj-internal-visibility.md) - The visibility default this refines
- [test-avoid-testing-private](test-avoid-testing-private.md) - Still prefer testing through public behavior where reasonable
