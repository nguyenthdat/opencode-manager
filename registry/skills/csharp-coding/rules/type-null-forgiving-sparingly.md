# type-null-forgiving-sparingly

> Use the null-forgiving operator (`!`) sparingly, and only with a clear justification

## Why It Matters

The `!` operator tells the compiler "trust me, this isn't null here" without any runtime check - it silences the warning but does nothing to prevent an actual `NullReferenceException` if you're wrong. Overusing it (especially as a reflex to silence warnings) defeats the entire purpose of enabling nullable reference types.

## Bad

```csharp
public string GetUserName(int id)
{
    var user = _repository.Find(id); // returns User?
    return user!.Name; // silences the warning, but this WILL throw if user is actually null
}

// Sprinkling ! everywhere just to make warnings go away, without checking correctness
var config = LoadConfig()!;
var name = config!.Name!;
```

## Good

```csharp
public string GetUserName(int id)
{
    var user = _repository.Find(id);
    if (user is null)
    {
        throw new UserNotFoundException(id); // explicit, informative failure instead of a bare NRE
    }
    return user.Name; // no ! needed - narrowed to non-null by the check above
}
```

## Legitimate, Justified Uses of `!`

```csharp
// 1. You have external knowledge the compiler can't infer (e.g. a value just
//    validated by a library the compiler doesn't understand), and you document why.
public string ParseRequiredField(JsonElement element)
{
    // The schema guarantees "name" is present and non-null; validated upstream.
    return element.GetProperty("name").GetString()!;
}

// 2. Test code asserting a precondition that the test itself just set up
[Fact]
public void ReturnsConfiguredValue()
{
    var result = _service.GetValue();
    Assert.NotNull(result);
    Use(result!); // acceptable after an explicit assertion, though `result.Should().NotBeNull()`-style
                  // patterns in FluentAssertions can narrow without needing `!` at all
}
```

## Prefer Narrowing Constructs Over `!`

```csharp
// ?? throw - fails loudly and immediately if actually null, instead of deferring to first use
var user = _repository.Find(id) ?? throw new UserNotFoundException(id);

// is not null pattern - narrows without an operator at all
if (maybeUser is not null) { Use(maybeUser); }
```

## See Also

- [type-nullable-reference-types](type-nullable-reference-types.md) - The feature this operator interacts with
- [type-notnullwhen-attributes](type-notnullwhen-attributes.md) - Reducing the NEED for `!` via proper annotations
