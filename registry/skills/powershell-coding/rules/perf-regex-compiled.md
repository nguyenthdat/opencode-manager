# perf-regex-compiled

> Use [regex]::new() with Compiled flag for repeated matching

## Why It Matters

PowerShell's `-match` operator compiles a new regex each time it's called in a loop — wasteful and slow. `[regex]::new($pattern, 'Compiled')` compiles the regex once and reuses it across thousands of matches. For high-volume text processing, compiled regex is 5-50x faster.

## Bad

```powershell
# -match recompiles regex each iteration — slow
$pattern = '^(?<date>\d{4}-\d{2}-\d{2}) (?<level>ERROR|WARN) (?<message>.+)$'

Get-Content huge.log | ForEach-Object {
    if ($_ -match $pattern) {
        [PSCustomObject]@{
            Date    = $Matches.date
            Level   = $Matches.level
            Message = $Matches.message
        }
    }
}
```

## Good

```powershell
# Compiled regex — parse once, match thousands of times
$pattern = '^(?<date>\d{4}-\d{2}-\d{2}) (?<level>ERROR|WARN) (?<message>.+)$'
$regex = [regex]::new($pattern, [System.Text.RegularExpressions.RegexOptions]::Compiled)

Get-Content huge.log | ForEach-Object {
    $match = $regex.Match($_)
    if ($match.Success) {
        [PSCustomObject]@{
            Date    = $match.Groups['date'].Value
            Level   = $match.Groups['level'].Value
            Message = $match.Groups['message'].Value
        }
    }
}
```

## Regex Options

```powershell
# Common RegexOptions combinations
$regex = [regex]::new($pattern, 'Compiled')                           # Speed
$regex = [regex]::new($pattern, 'Compiled, IgnoreCase')               # Speed + case-insensitive
$regex = [regex]::new($pattern, 'Compiled, Multiline, IgnoreCase')    # Multi-line

# Static method (simpler, no instance)
[regex]::Match($string, $pattern, 'Compiled')

# For single-use matching, -match is fine
if ($email -match '^[^@]+@[^@]+$') { ... }  # OK — used once
```

## See Also

- [perf-string-builder](perf-string-builder.md) - StringBuilder for string ops
- [perf-pipeline-over-loops](perf-pipeline-over-loops.md) - Pipeline performance
