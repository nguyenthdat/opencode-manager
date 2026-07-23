# name-variables-camelCase

> Use camelCase for variables

## Why It Matters

camelCase is the PowerShell community convention for variable names — clear, consistent, and scannable. PascalCase or snake_case variables stand out awkwardly and break the visual rhythm of PowerShell code. Consistency helps readers focus on logic, not naming style.

## Bad

```powershell
$UserCount = 42           # PascalCase — looks like a type
$user_count = 42          # snake_case — Python style
$MAX_CONNECTIONS = 100    # SCREAMING — for constants only
$SERVERNAME = 'prod-01'   # ALLCAPS — looks like env var
```

## Good

```powershell
$userCount = 42
$maxConnections = 100
$serverName = 'prod-01'
$isEnabled = $true
$processedItems = @()

# Loop variables
foreach ($item in $collection) { ... }
foreach ($userId in $userIds) { ... }
for ($i = 0; $i -lt $count; $i++) { ... }
```

## Common Patterns

```powershell
# Boolean: Is/Has/Should/Can prefix
$isValid = $true
$hasChildren = $false
$shouldContinue = $true
$canExecute = $false

# Collections: plural noun
$users = Get-ADUser -Filter *
$logEntries = Get-Content app.log
$connectionStrings = @{}

# Counters and accumulators
$total = 0
$errorCount = 0
$successCount = 0

# Temporary results
$result = Invoke-Something
$response = Invoke-RestMethod $uri
$stream = [System.IO.File]::OpenRead($path)
```

## See Also

- [name-boolean-is-has](name-boolean-is-has.md) - Boolean naming
- [name-plural-collections](name-plural-collections.md) - Collection naming
