# doc-inline-why

> Comment WHY not WHAT

## Why It Matters

Code tells you WHAT happens; comments should explain WHY. "What" comments (`# increment i by 1`) are noise — they duplicate the code and become outdated. "Why" comments (`# offset by 1 because AD indices start at 0`) capture decisions that aren't obvious from the code, saving future developers hours of investigation.

## Bad

```powershell
# Useless "what" comments — code already says this
$count = 0                      # Initialize counter to 0
$threshold = 5                  # Set threshold to 5

foreach ($item in $items) {     # Loop through items
    $count++                    # Increment counter
    if ($count -gt $threshold) { # Check if count exceeds threshold
        break                   # Exit loop
    }
}

# Or no comments at all in tricky code
$query = "SELECT * FROM Users WHERE LastLogin < DATEADD(day, -90, GETDATE()) AND NOT (Name LIKE 'SVC_%' AND Disabled = 1)"
```

## Good

```powershell
# Service accounts excluded because they're managed by provisioning automation
# Disabled accounts included because we re-enable them as part of the reactivation workflow
$query = @'
SELECT * FROM Users
WHERE LastLogin < DATEADD(day, -90, GETDATE())
  AND NOT (Name LIKE 'SVC_%')
'@

# Max of 500 to avoid AppLocker script length limits
$maxRetries = 5
$retryDelayMs = [math]::Pow(2, $attempt) * 1000  # Exponential backoff: 2s, 4s, 8s...

# Use -replace instead of .Replace() because -replace is case-insensitive
# .Replace() is case-sensitive and would miss 'Server=Prod-DB'
$cleanedValue = $rawValue -replace 'Server=Prod-DB', 'Server=Dev-DB'
```

## Comment Quality Rules

```powershell
# GOOD comments explain:
# - Why a particular approach was chosen over alternatives
# - Non-obvious business rules
# - Workarounds for limitations / bugs
# - Performance considerations
# - Security implications

# BAD comments (remove these):
# - Code narration (restating what code does)
# - Outdated comments that contradict the code
# - Commented-out code (use version control)
# - TODO without owner or ticket reference
```

## See Also

- [doc-comment-based-help](doc-comment-based-help.md) - Function help
- [doc-readme-module](doc-readme-module.md) - Module README
