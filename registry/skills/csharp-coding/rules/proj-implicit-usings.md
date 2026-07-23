# proj-implicit-usings

> Use `ImplicitUsings` and a shared `GlobalUsings.cs` file to eliminate repetitive `using` boilerplate

## Why It Matters

Every file re-declaring `using System;`, `using System.Linq;`, `using System.Threading.Tasks;` (and similar near-universal namespaces) is pure repetition. `ImplicitUsings` auto-includes the SDK-appropriate common set; a project-specific `GlobalUsings.cs` extends that with your own commonly-used namespaces, both applied project-wide from one place.

## Bad

```csharp
// Every single file in the project repeats these same five usings
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MySolution.Domain.Orders;

namespace MySolution.Api;

public class OrderController
{
    // ...
}
```

## Good

```xml
<!-- .csproj -->
<PropertyGroup>
  <ImplicitUsings>enable</ImplicitUsings> <!-- auto-includes System, System.Linq, System.Threading.Tasks, etc. -->
</PropertyGroup>
```

```csharp
// GlobalUsings.cs - one file, applies to every file in the project
global using MySolution.Domain.Orders;
global using MySolution.Domain.Common;
```

```csharp
namespace MySolution.Api;

public class OrderController
{
    // Order, and every commonly-used BCL type, is available with zero using statements here
}
```

## What ImplicitUsings Actually Includes

```text
Varies by SDK: Microsoft.NET.Sdk includes System, System.Collections.Generic,
System.Linq, System.Threading.Tasks, and a few more; Microsoft.NET.Sdk.Web
adds ASP.NET Core-specific namespaces (System.Net.Http.Json, Microsoft.AspNetCore.Builder,
etc.) on top of the base set.
```

## Don't Overuse Global Usings for Rarely-Used Namespaces

```csharp
// A namespace used in only one or two files doesn't belong in GlobalUsings.cs -
// keep it as a normal, local `using` in the files that actually need it, so
// GlobalUsings.cs stays a meaningful, curated list rather than "everything".
using System.Text.RegularExpressions; // used in exactly one file - keep it local
```

## See Also

- [proj-file-scoped-namespaces](proj-file-scoped-namespaces.md) - Another boilerplate-reduction convention
- [proj-directory-build-props](proj-directory-build-props.md) - Enabling ImplicitUsings solution-wide
