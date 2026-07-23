# name-functions-Verb-Noun

> Use Verb-Noun format for all functions

## Why It Matters

The Verb-Noun convention is PowerShell's fundamental naming rule — built-in cmdlets, community modules, and tooling all expect it. Functions that don't follow this pattern feel foreign, don't get discovered by `Get-Command`, and break user expectations. Every exported function must be Verb-Noun.

## Bad

```powershell
# Non-standard names
function getUser { param($Id) ... }
function process_data { param($Input) ... }
function FetchRecords { param($Query) ... }
function mkdir_p { param($Path) ... }
```

## Good

```powershell
# Verb-Noun format
function Get-User { param($Id) ... }
function ConvertFrom-Data { param($Input) ... }
function Get-Record { param($Query) ... }
function New-Directory { param($Path) ... }
```

## Approved Verbs Only

```powershell
# Check if a verb is approved
Get-Verb -Verb 'Get'      # True
Get-Verb -Verb 'Fetch'    # False — use Get instead
Get-Verb -Verb 'Create'   # False — use New instead
Get-Verb -Verb 'Erase'    # False — use Remove instead

# See all verbs in a group
Get-Verb | Where-Object Group -eq 'Data' | Format-Table Verb, Group
# Data: Backup, Checkpoint, Compare, Convert, ConvertFrom, ConvertTo, ...
```

## When to Deviate

```powershell
# Private/internal functions: Verb-Noun still recommended, prefix optional
function _connectDatabase { ... }
function _parseConfigFile { ... }

# Very short utility functions in scripts: prefix with Invoke- or Test-
function Test-IsAdmin { [bool]([Security.Principal.WindowsPrincipal]::new(...)) }
function Invoke-Cleanup { Remove-Item $env:TEMP\*.tmp }

# NEVER create functions without Verb-Noun in a published module
```

## See Also

- [cmd-approved-verbs](cmd-approved-verbs.md) - Approved verbs
- [cmd-singular-nouns](cmd-singular-nouns.md) - Singular nouns
