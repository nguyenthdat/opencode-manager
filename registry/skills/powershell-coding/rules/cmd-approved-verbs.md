# cmd-approved-verbs

> Use approved verbs from Get-Verb (Get, Set, New, Remove, etc.)

## Why It Matters

Approved verbs create a predictable, discoverable interface. Users familiar with `Get-*` and `Set-*` conventions instantly understand what your function does. Unapproved verbs trigger PSScriptAnalyzer warnings and break user expectations.

## Bad

```powershell
# Unapproved verbs — confusing and inconsistent
function Fetch-UserData { param($Id) ... }
function Modify-Config { param($Path) ... }
function Build-Report { param($Name) ... }
function Erase-Logs { param($Age) ... }
```

## Good

```powershell
# Approved verb–noun pairs
function Get-UserData { param($Id) ... }
function Set-Config { param($Path) ... }
function New-Report { param($Name) ... }
function Remove-Logs { param($Age) ... }

# List all approved verbs at runtime
Get-Verb | Sort-Object Verb | Format-Table Verb, Group
```

## Common Approved Verbs

```powershell
# Data lifecycle
Get-*       # Retrieve
New-*       # Create
Set-*       # Update
Remove-*    # Delete

# Diagnostics
Test-*      # Boolean validation
Debug-*     # Debug operations
Trace-*     # Trace operations

# Control flow
Start-*     # Begin operation
Stop-*      # Halt operation
Restart-*   # Restart operation
Suspend-*   # Pause
Resume-*    # Continue after pause

# Communication
Write-*     # Output information
Read-*      # Input data
Send-*      # Transmit
Receive-*   # Accept transmission

# Lifecycle
Install-*   # Deploy
Uninstall-* # Remove deployment
Register-*  # Register with system
Unregister-*# Remove registration

# State management
Enable-*    # Turn on
Disable-*   # Turn off
Invoke-*    # Execute action
```

## See Also

- [cmd-singular-nouns](cmd-singular-nouns.md) - Use singular nouns
- [name-functions-Verb-Noun](name-functions-Verb-Noun.md) - Verb-Noun naming
