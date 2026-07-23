# type-avoid-object-typed

> Avoid `object`-typed parameters/return values/fields when a generic or specific type will do

## Why It Matters

An `object`-typed API forces every caller to cast (with associated runtime risk) and boxes value types on the way in. It also documents nothing about what's actually expected - `object` accepts literally anything, pushing all type-correctness responsibility onto runtime checks and documentation instead of the compiler.

## Bad

```csharp
public class EventBus
{
    public void Publish(object eventData) { /* ... */ } // accepts literally anything

    public void Subscribe(Action<object> handler) { /* ... */ }
}

bus.Subscribe(e =>
{
    var order = (OrderPlaced)e; // unchecked cast - InvalidCastException risk, no compile-time safety
    Process(order);
});
```

## Good

```csharp
public class EventBus
{
    public void Publish<TEvent>(TEvent eventData) where TEvent : notnull { /* ... */ }

    public void Subscribe<TEvent>(Action<TEvent> handler) where TEvent : notnull { /* ... */ }
}

bus.Subscribe<OrderPlaced>(order => Process(order)); // compiler-checked, no cast needed
```

## When `object` Is the Right Choice

```csharp
// A genuinely type-erased cache, or a boundary designed for heterogeneous data
// (rare, and usually still better served by a common interface or generic
// constraint) is one of the few legitimate uses.
public interface ICacheEntry
{
    object Value { get; } // truly heterogeneous storage - cache doesn't know/care about the type
}

// Even here, the CONSUMING code should cast through a known contract immediately:
public T GetTyped<T>(ICacheEntry entry) => (T)entry.Value;
```

## Prefer a Shared Interface Over `object` for "Any of These Types"

```csharp
// Not "any object at all" but "any of a known family of types" -> use an interface
public interface IEvent { DateTime OccurredAt { get; } }
public record OrderPlaced(Guid OrderId) : IEvent { public DateTime OccurredAt { get; } = DateTime.UtcNow; }

public void Publish(IEvent eventData) { /* ... */ } // constrained, self-documenting
```

## See Also

- [type-avoid-dynamic](type-avoid-dynamic.md) - The even less type-safe alternative to avoid
- [api-generic-constraints](api-generic-constraints.md) - Generics as the type-safe alternative
- [mem-avoid-boxing](mem-avoid-boxing.md) - Boxing cost of object-typed value type usage
