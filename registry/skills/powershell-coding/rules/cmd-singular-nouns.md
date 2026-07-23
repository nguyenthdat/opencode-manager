# cmd-singular-nouns

> Use singular nouns for cmdlet names (Get-User, not Get-Users)

## Why It Matters

Singular nouns match the convention of all built-in PowerShell cmdlets (`Get-Process`, not `Get-Processes`). Singular nouns also compose better in the pipeline — `Get-User | Get-Group` reads naturally as "get the group of a user", while plural nouns create awkward chains.

## Bad

```powershell
# Plural nouns — breaks convention
function Get-Users { param($Department) ... }
function Get-Services { param($ComputerName) ... }
function Remove-Files { param($Pattern) ... }

Get-Users | Get-Groups  # Awkward: "get groups of users"
```

## Good

```powershell
# Singular nouns — idiomatic
function Get-User { param($Department) ... }
function Get-Service { param($ComputerName) ... }
function Remove-File { param($Pattern) ... }

Get-User | Get-Group  # Natural: "get group of user"
```

## Edge Cases

```powershell
# OK: Plural when the noun is inherently plural
function Get-DnsSettings { ... }  # Settings is plural by nature
function Get-EventLogs { ... }    # Logs = collection

# OK: Common plural nouns in established usage
function Get-ChildItem { ... }    # Built-in, legacy
function Get-Assemblies { ... }   # Common .NET convention
```

## See Also

- [cmd-approved-verbs](cmd-approved-verbs.md) - Approved verbs
- [name-functions-Verb-Noun](name-functions-Verb-Noun.md) - Verb-Noun naming
