# name-plural-collections

> Use plural names for arrays/collections

## Why It Matters

Plural names instantly signal "this is a collection" — readers know they can iterate, count, and index it. Singular names for collections are misleading: `$user` implies a single user, but `$user[0]` is confusing. The plural convention spans most programming languages and PowerShell.

## Bad

```powershell
$user = Get-ADUser -Filter *        # Plural result, singular name — confusing
$process = Get-Process              # Is it one process or many?
$fileList = Get-ChildItem           # Redundant "List" suffix
$itemArray = @('a', 'b')           # Redundant "Array" suffix
$connection = Get-ConnectionPool    # Actually returns array
```

## Good

```powershell
$users = Get-ADUser -Filter *
$processes = Get-Process
$files = Get-ChildItem
$names = @('Alice', 'Bob', 'Charlie')
$connections = Get-ConnectionPool
$logEntries = Get-Content app.log
$errorRecords = $Error  # Built-in collection
```

## Collection Naming Patterns

```powershell
# Standard plurals
$servers = @('web-01', 'web-02')
$databases = Get-SqlDatabase
$results = Invoke-SqlQuery

# Irregular plurals (follow English)
$children = Get-ChildItem
$indices = 0..9
$data = Get-Content  # "data" is already plural (singular: datum)

# Named collections (descriptive)
$activeUsers = $users | Where-Object Enabled
$failedJobs = $results | Where-Object Status -eq 'Failed'
$pendingRequests = $queue.ToArray()
```

## See Also

- [name-variables-camelCase](name-variables-camelCase.md) - Variable naming
- [name-boolean-is-has](name-boolean-is-has.md) - Boolean naming
