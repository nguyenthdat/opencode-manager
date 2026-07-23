# linq-groupby-lookup

> Use `GroupBy`/`ToLookup` instead of repeated manual grouping loops

## Why It Matters

Grouping elements by a key manually (nested loops, or a `Dictionary<K, List<T>>` built by hand with `TryGetValue`/`Add` boilerplate) is exactly what `GroupBy` (deferred, for one-time iteration) and `ToLookup` (eagerly materialized, reusable, indexable) already do - correctly and concisely.

## Bad

```csharp
var byDepartment = new Dictionary<string, List<Employee>>();
foreach (var employee in employees)
{
    if (!byDepartment.TryGetValue(employee.Department, out var list))
    {
        list = [];
        byDepartment[employee.Department] = list;
    }
    list.Add(employee);
}

foreach (var (department, group) in byDepartment)
{
    Console.WriteLine($"{department}: {group.Count}");
}
```

## Good

```csharp
var byDepartment = employees.GroupBy(e => e.Department);

foreach (var group in byDepartment)
{
    Console.WriteLine($"{group.Key}: {group.Count()}");
}

// ToLookup: eagerly built once, safe to query repeatedly and index directly (unlike GroupBy)
ILookup<string, Employee> lookup = employees.ToLookup(e => e.Department);
var engineering = lookup["Engineering"]; // returns an empty sequence if the key is absent, never null/throws
```

## GroupBy With a Result Selector

```csharp
var summaries = employees
    .GroupBy(e => e.Department, (department, group) => new
    {
        Department = department,
        Count = group.Count(),
        TotalSalary = group.Sum(e => e.Salary)
    });
```

## GroupBy vs ToLookup

```text
GroupBy   -> deferred execution; re-runs the grouping every time you enumerate it;
             use when you're going to iterate the grouped result exactly once.
ToLookup  -> eager, computed once immediately; supports direct indexer access
             (lookup[key]) with no exception for missing keys; use when you'll
             query by key repeatedly or need indexer-style access.
```

## See Also

- [linq-collection-choice](linq-collection-choice.md) - Choosing the right structure for repeated lookups
- [linq-deferred-execution-aware](linq-deferred-execution-aware.md) - Deferred vs eager execution in general
