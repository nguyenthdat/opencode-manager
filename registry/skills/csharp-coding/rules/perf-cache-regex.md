# perf-cache-regex

> Compile and cache `Regex` instances (or use `[GeneratedRegex]`) instead of constructing them per call

## Why It Matters

Constructing a `new Regex(pattern)` parses and compiles the pattern every time - expensive if done repeatedly (e.g. inside a per-request validation method). Caching a single static instance amortizes that cost to once; `RegexOptions.Compiled` further JITs the pattern into IL for faster matching at the cost of slower startup; `[GeneratedRegex]` (.NET 7+) does the compilation at build time via a source generator, giving the best of both.

## Bad

```csharp
public bool IsValidEmail(string input)
{
    var regex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$"); // parsed and compiled on EVERY call
    return regex.IsMatch(input);
}
```

## Good: Cached Static Instance

```csharp
public static partial class Validators
{
    private static readonly Regex EmailRegex =
        new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static bool IsValidEmail(string input) => EmailRegex.IsMatch(input);
}
```

## Better: Source-Generated Regex (.NET 7+)

```csharp
public static partial class Validators
{
    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.CultureInvariant)]
    private static partial Regex EmailRegex();

    public static bool IsValidEmail(string input) => EmailRegex().IsMatch(input);
}
// Compiled entirely at BUILD time - no runtime compilation cost at all, and
// fully trimming/NativeAOT-compatible unlike RegexOptions.Compiled.
```

## RegexOptions.Compiled Tradeoffs

```text
RegexOptions.Compiled JITs the pattern into IL the first time it's used,
trading slower first-use latency for faster subsequent matches - worth it for
a regex used very frequently over the app's lifetime, not worth it for a
regex used once or rarely (parsing overhead dominates in that case).
[GeneratedRegex] avoids this tradeoff entirely by doing the equivalent work
at compile time instead.
```

## See Also

- [perf-source-generators-over-reflection](perf-source-generators-over-reflection.md) - The source-generator pattern in general
- [mem-object-pooling](mem-object-pooling.md) - Related "avoid rebuilding expensive objects" principle
