# proj-file-scoped-namespaces

> Use file-scoped namespaces (`namespace Foo.Bar;`) to reduce nesting and indentation

## Why It Matters

Block-scoped namespaces (`namespace Foo.Bar { ... }`) indent an entire file's content one level for no semantic benefit when a file only ever declares types in one namespace (the overwhelmingly common case). File-scoped namespace declarations (C# 10+) eliminate that indentation entirely, and are now the default template output and StyleCop-recommended form.

## Bad

```csharp
namespace MySolution.Domain.Orders
{
    public class OrderProcessor
    {
        public void Process(Order order)
        {
            if (order.Total > 0)
            {
                // every line here is indented one level deeper than necessary
            }
        }
    }
}
```

## Good

```csharp
namespace MySolution.Domain.Orders;

public class OrderProcessor
{
    public void Process(Order order)
    {
        if (order.Total > 0)
        {
            // one less level of indentation across the entire file
        }
    }
}
```

## Enforcing It via .editorconfig

```ini
# .editorconfig
csharp_style_namespace_declarations = file_scoped:warning
```

## Only One Namespace Per File

```csharp
// A file-scoped namespace applies to the ENTIRE file - if a file genuinely
// needs multiple namespaces (rare, and usually a sign the file should be
// split), it must use the block-scoped form instead.
namespace MySolution.Domain.Orders
{
    public class OrderProcessor { }
}

namespace MySolution.Domain.Invoices
{
    public class InvoiceProcessor { }
}
```

## See Also

- [name-namespace-matches-folder](name-namespace-matches-folder.md) - Naming the namespace itself
- [lint-editorconfig-enforce](lint-editorconfig-enforce.md) - Enforcing style choices like this one
