# linq-firstordefault-vs-first

> Choose `First()`/`Single()` vs `FirstOrDefault()`/`SingleOrDefault()` deliberately, and always check the default result

## Why It Matters

`First()`/`Single()` throw `InvalidOperationException` when no element matches - appropriate when a missing element is a genuine bug/invariant violation. `FirstOrDefault()`/`SingleOrDefault()` return `default(T)` (null for reference types, `0`/`false`/etc. for value types) silently - appropriate when "not found" is a normal, expected outcome that the caller must then check for.

## Bad

```csharp
// Silently proceeds with a null reference if no admin exists - NullReferenceException later, far from the cause
var admin = users.FirstOrDefault(u => u.Role == "Admin");
Console.WriteLine(admin.Name); // boom, eventually, somewhere else entirely

// Throws with a generic, unhelpful message when the real intent was "check if exists"
var maybeUser = users.First(u => u.Id == searchedId); // throws if not found, forcing a try/catch
```

## Good

```csharp
// "Not found" is expected -> use FirstOrDefault and check the result explicitly
var maybeUser = users.FirstOrDefault(u => u.Id == searchedId);
if (maybeUser is null)
{
    return NotFound();
}
Use(maybeUser);

// "Not found" would be a genuine bug/invariant violation -> use First, let it throw
var systemAdmin = users.First(u => u.Role == "SystemAdmin");
// If this ever throws, it means the seed data / invariant is broken - that's the point.
```

## Single vs First

```csharp
// First()/FirstOrDefault(): "give me one, I don't care if there are more"
var anyActiveUser = users.First(u => u.IsActive);

// Single()/SingleOrDefault(): "there must be EXACTLY one - throw if there are 0 OR more than 1"
var uniqueEmailOwner = users.Single(u => u.Email == email); // enforces email uniqueness as an invariant check
```

## Guarding Against Null Reference Types

```csharp
// With nullable reference types enabled, FirstOrDefault's return type is correctly
// inferred as T? - the compiler will warn if you use it without a null check.
User? user = users.FirstOrDefault(u => u.Id == id); // T? signals "might be null" at the type level
```

## See Also

- [linq-any-vs-count](linq-any-vs-count.md) - Related existence-check LINQ choice
- [type-nullable-reference-types](type-nullable-reference-types.md) - Making the "might not exist" contract explicit
