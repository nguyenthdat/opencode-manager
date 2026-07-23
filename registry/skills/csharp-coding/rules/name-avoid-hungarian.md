# name-avoid-hungarian

> Avoid Hungarian notation and type-in-name suffixes/prefixes; let the type system carry type information

## Why It Matters

Hungarian notation (`strName`, `iCount`, `bIsValid`) predates modern IDEs with inline type display and strong static typing. In C#, the compiler and IDE already show you the type of every identifier - encoding it in the name too is redundant, and worse, becomes actively misleading the moment the type changes but the name doesn't get updated.

## Bad

```csharp
public class clsOrderProcessor // "cls" prefix - redundant, IDEs already show you it's a class
{
    private string strCustomerName;
    private int iRetryCount;
    private bool bIsValid;

    public void ProcessOrder(OrderDto objOrder) // "obj" suffix communicates nothing
    {
        List<string> lstItems = objOrder.GetItems(); // "lst" - the type is already List<string> right there
    }
}
```

## Good

```csharp
public class OrderProcessor
{
    private string _customerName;
    private int _retryCount;
    private bool _isValid;

    public void ProcessOrder(OrderDto order)
    {
        List<string> items = order.GetItems();
        // or, letting type inference do its job:
        var items2 = order.GetItems();
    }
}
```

## Interface `I` Prefix Is a Deliberate Exception

```csharp
// The single, well-established exception to "no type-in-name" is the interface
// I prefix - it's so universal in .NET that it functions as a role marker,
// not redundant type-in-name noise. See name-interface-i-prefix.
public interface IPaymentGateway { }
```

## Suffixes That ARE Meaningful (Not Hungarian)

```csharp
// These aren't Hungarian notation - they describe the type's ROLE, not restate
// its exact CLR type, and are widely useful conventions:
public class OrderDto { }       // Data Transfer Object - a role, not a type restatement
public class OrderException { } // Exception hierarchy naming (see err-custom-hierarchy)
public interface IOrderRepository { } // I prefix, see above
```

## See Also

- [name-interface-i-prefix](name-interface-i-prefix.md) - The deliberate exception to this rule
- [name-pascalcase-public](name-pascalcase-public.md) - General naming conventions
