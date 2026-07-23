# pipe-parallel-foreach

> Use ForEach-Object -Parallel for independent operations (7.0+)

## Why It Matters

`ForEach-Object -Parallel` runs script blocks concurrently in separate runspaces, leveraging multi-core CPUs for CPU-bound, independent tasks. It provides dramatic speedups for operations like API calls, file processing, or computation-heavy transformations — without the complexity of manual runspace management.

## Bad

```powershell
# Sequential — 100 URLs = 100 seconds if each takes 1s
$urls = 1..100 | ForEach-Object { "https://api.example.com/item/$_" }

$urls | ForEach-Object {
    Invoke-RestMethod -Uri $_
}  # ~100 seconds
```

## Good

```powershell
# Parallel — 100 URLs with ThrottleLimit 10 = ~10 seconds
$urls = 1..100 | ForEach-Object { "https://api.example.com/item/$_" }

$urls | ForEach-Object -Parallel {
    $response = Invoke-RestMethod -Uri $_
    [PSCustomObject]@{
        Id    = $response.id
        Name  = $response.name
    }
} -ThrottleLimit 10
```

## Important Caveats

```powershell
# Each runspace has its own scope — use $using: for external variables
$apiKey = Get-Secret 'ApiKey'
$baseUrl = 'https://api.example.com'

1..100 | ForEach-Object -Parallel {
    # $apiKey and $baseUrl NOT available — use $using:
    $headers = @{ Authorization = "Bearer $($using:apiKey)" }
    Invoke-RestMethod -Uri "$($using:baseUrl)/item/$_" -Headers $headers
} -ThrottleLimit 10

# NOT thread-safe — avoid writing to shared files
# DO use: Write-Output (results are serialized back to caller)
# DON'T use: Add-Content to a shared file from parallel blocks
```

## When Sequential Is Better

```powershell
# Sequential when operations are I/O-bound and cheap
# Parallel adds runspace overhead — not worth it for small workloads
Get-Process | ForEach-Object { $_.Name }  # No benefit to parallel

# Parallel ONLY when:
# 1. Operations are CPU-bound or have high latency (network)
# 2. Operations are independent (no shared state)
# 3. Results don't depend on order
```

## See Also

- [pipe-foreach-object](pipe-foreach-object.md) - Sequential ForEach-Object
- [perf-foreach-object-parallel](perf-foreach-object-parallel.md) - Performance with parallel
