# api-interface-segregation

> Keep interfaces small and role-based; split a fat interface into focused ones (ISP)

## Why It Matters

A large interface forces every implementer to provide (or throw `NotSupportedException` for) methods it doesn't actually support, and forces every consumer to depend on capabilities it doesn't use. Small, role-based interfaces let types implement exactly what they support and let consumers depend on exactly what they need - both easier to mock and easier to evolve.

## Bad

```csharp
public interface IRepository<T>
{
    T? GetById(int id);
    IEnumerable<T> GetAll();
    void Add(T item);
    void Update(T item);
    void Delete(int id);
    void BulkImport(IEnumerable<T> items);
    Task<byte[]> ExportToExcelAsync();
}

// A read-only reporting repository is forced to fake unsupported members
public class ReadOnlyReportRepository : IRepository<Report>
{
    public void Add(Report item) => throw new NotSupportedException();
    public void Update(Report item) => throw new NotSupportedException();
    public void Delete(int id) => throw new NotSupportedException();
    public void BulkImport(IEnumerable<Report> items) => throw new NotSupportedException();
    // ...
}
```

## Good

```csharp
public interface IReadRepository<T>
{
    T? GetById(int id);
    IEnumerable<T> GetAll();
}

public interface IWriteRepository<T>
{
    void Add(T item);
    void Update(T item);
    void Delete(int id);
}

public interface IExportable
{
    Task<byte[]> ExportToExcelAsync();
}

// Implement only the roles that make sense
public class ReadOnlyReportRepository : IReadRepository<Report>, IExportable
{
    public Report? GetById(int id) => /* ... */ null;
    public IEnumerable<Report> GetAll() => /* ... */ [];
    public Task<byte[]> ExportToExcelAsync() => /* ... */ Task.FromResult(Array.Empty<byte>());
}

// Consumers depend on only what they need
public class ReportController(IReadRepository<Report> repository) { /* ... */ }
```

## Composing Full Capability When Needed

```csharp
public interface IFullRepository<T> : IReadRepository<T>, IWriteRepository<T>;

public class SqlOrderRepository : IFullRepository<Order>
{
    // implements both roles because SqlOrderRepository genuinely supports both
}
```

## See Also

- [api-sealed-by-default](api-sealed-by-default.md) - Composition over inheritance, generally
- [test-mock-interfaces-not-concretes](test-mock-interfaces-not-concretes.md) - Small interfaces are easier to mock
- [di-register-interfaces](di-register-interfaces.md) - Registering focused interfaces in DI
