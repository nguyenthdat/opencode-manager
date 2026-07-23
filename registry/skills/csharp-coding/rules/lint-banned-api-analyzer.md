# lint-banned-api-analyzer

> Use a banned-symbols analyzer to forbid dangerous APIs at compile time (`.Result`, `DateTime.Now`, `Thread.Sleep` in async code, etc.)

## Why It Matters

Some APIs are almost never correct to call in a given codebase's context (blocking calls in async code, non-deterministic time sources in business logic, insecure crypto primitives) but a plain code review can miss them. `Microsoft.CodeAnalysis.BannedApiAnalyzers` turns "don't use X" from a documented convention into a compile-time error the moment anyone tries.

## Bad

```text
(no banned-API enforcement)
Any developer can freely call task.Result, DateTime.Now, or MD5.Create() and
the build succeeds - these mistakes are only caught in code review, if at all.
```

## Good

```xml
<!-- .csproj -->
<ItemGroup>
  <PackageReference Include="Microsoft.CodeAnalysis.BannedApiAnalyzers" PrivateAssets="all" />
</ItemGroup>
<ItemGroup>
  <AdditionalFiles Include="BannedSymbols.txt" />
</ItemGroup>
```

```text
# BannedSymbols.txt
P:System.Threading.Tasks.Task`1.Result;Use 'await' instead of blocking on .Result (see async-no-sync-over-async)
M:System.Threading.Tasks.Task.Wait;Use 'await' instead of blocking with .Wait()
P:System.DateTime.Now;Inject IClock/IDateTimeProvider instead of calling DateTime.Now directly
M:System.Security.Cryptography.MD5.Create;MD5 is cryptographically broken; use SHA256 or a keyed HMAC
```

## Now Enforced at Build Time

```csharp
var result = SomeAsyncMethod().Result;
// error RS0030: The symbol 'Task<T>.Result' is banned in this project:
// Use 'await' instead of blocking on .Result (see async-no-sync-over-async)
```

## Common Candidates for a Banned List

```text
Task<T>.Result, Task.Wait(), Task.GetAwaiter().GetResult() - sync-over-async
DateTime.Now, DateTime.Today - non-deterministic, untestable time source
MD5.Create(), SHA1.Create() - weak cryptographic hashes
Console.WriteLine in library code - should use ILogger instead
Thread.Sleep in async methods - should use Task.Delay
```

## See Also

- [async-no-sync-over-async](async-no-sync-over-async.md) - Why .Result/.Wait() are banned in most codebases
- [anti-datetime-now-untestable](anti-datetime-now-untestable.md) - Why DateTime.Now is typically banned
- [lint-roslyn-analyzers](lint-roslyn-analyzers.md) - The broader analyzer ecosystem this complements
