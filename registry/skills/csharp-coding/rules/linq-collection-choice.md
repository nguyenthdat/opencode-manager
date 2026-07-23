# linq-collection-choice

> Choose `List<T>`, `Dictionary<K,V>`, `HashSet<T>`, etc. based on actual access pattern, not habit

## Why It Matters

Defaulting to `List<T>` for everything means O(n) lookups where a `Dictionary<K,V>` or `HashSet<T>` would give O(1), and unnecessary duplicate storage where a `HashSet<T>` would enforce uniqueness for free. Picking the collection that matches how the data is actually queried and mutated is one of the cheapest, highest-leverage performance decisions available.

## Bad

```csharp
public class UserDirectory
{
    private readonly List<User> _users = [];

    public void Add(User user) => _users.Add(user);

    public User? FindById(int id) => _users.FirstOrDefault(u => u.Id == id); // O(n) every lookup

    public bool Contains(int id) => _users.Any(u => u.Id == id); // O(n) again
}
```

## Good

```csharp
public class UserDirectory
{
    private readonly Dictionary<int, User> _usersById = [];

    public void Add(User user) => _usersById[user.Id] = user;

    public User? FindById(int id) => _usersById.GetValueOrDefault(id); // O(1)

    public bool Contains(int id) => _usersById.ContainsKey(id); // O(1)
}
```

## Decision Guide

```text
List<T>            - ordered, indexed access; duplicates allowed; sequential scans
Dictionary<K,V>     - fast key -> value lookup; no meaningful order guarantee
HashSet<T>          - fast membership/uniqueness checks; no duplicates, no order
SortedDictionary<K,V> / SortedSet<T> - need sorted order maintained automatically
Queue<T> / Stack<T> - strict FIFO/LIFO processing order
LinkedList<T>       - frequent insert/remove in the MIDDLE of a large sequence (rare - usually
                      List<T> or a different data structure is still better; benchmark first)
```

## Combining Structures for Multiple Access Patterns

```csharp
// Need both "iterate in insertion order" AND "fast lookup by key"?
// Keep both, kept in sync, rather than forcing one structure to do both jobs badly.
public class OrderedUserDirectory
{
    private readonly List<User> _inOrder = [];
    private readonly Dictionary<int, User> _byId = [];

    public void Add(User user)
    {
        _inOrder.Add(user);
        _byId[user.Id] = user;
    }
}
```

## See Also

- [immut-frozen-collections](immut-frozen-collections.md) - The read-optimized variant for static data
- [linq-groupby-lookup](linq-groupby-lookup.md) - Building lookup structures from queries
- [perf-avoid-linq-hot-path](perf-avoid-linq-hot-path.md) - Related performance guidance
