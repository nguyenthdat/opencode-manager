# proj-separate-test-projects

> Keep test projects entirely separate from production assemblies; never ship test code in a production package

## Why It Matters

Test code and production code have different dependency graphs (test frameworks, mocking libraries, Testcontainers) and different packaging concerns (tests should never ship inside a NuGet package or deployed artifact). Mixing them bloats the production output, potentially exposes test-only credentials/fixtures, and confuses "what actually runs in production" for anyone reading the project.

## Bad

```text
MySolution.Api/
  Program.cs
  OrderController.cs
  OrderControllerTests.cs   <-- test file living in the PRODUCTION project
```

```xml
<!-- MySolution.Api.csproj -->
<ItemGroup>
  <PackageReference Include="xunit" Version="2.9.0" /> <!-- test framework in a production project! -->
</ItemGroup>
```

## Good

```text
src/
  MySolution.Api/
    Program.cs
    OrderController.cs
tests/
  MySolution.Api.Tests/
    OrderControllerTests.cs
```

```xml
<!-- tests/MySolution.Api.Tests/MySolution.Api.Tests.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <IsPackable>false</IsPackable> <!-- test projects should never be packed into a NuGet package -->
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="xunit" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
    <ProjectReference Include="..\..\src\MySolution.Api\MySolution.Api.csproj" />
  </ItemGroup>
</Project>
```

## Test-Only Helper Classes Stay in the Test Project

```csharp
// tests/MySolution.Api.Tests/TestData/OrderFactory.cs - test data builders live here,
// never inside the shipped production assembly.
public static class OrderFactory
{
    public static Order CreateValidOrder() => new() { Total = 100m };
}
```

## Integration Test Projects Separate From Unit Test Projects

```text
tests/
  MySolution.Domain.Tests/          (fast, pure unit tests)
  MySolution.IntegrationTests/      (Testcontainers, WebApplicationFactory - slower)
```

## See Also

- [proj-solution-folder-layout](proj-solution-folder-layout.md) - The src/tests split in context
- [proj-internalsvisibleto-tests](proj-internalsvisibleto-tests.md) - Test projects accessing internals safely
