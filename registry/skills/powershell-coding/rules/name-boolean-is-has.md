# name-boolean-is-has

> Prefix boolean variables with Is/Has/Should

## Why It Matters

Boolean variables prefixed with `is`, `has`, `should`, or `can` read as questions that unambiguously answer yes/no. Without this pattern, booleans look like any other variable — `$enabled` could be an object, `$running` could be a process name. The prefix makes code self-documenting.

## Bad

```powershell
$enabled = $true        # Boolean or object reference?
$running = $true        # Boolean or process status string?
$connected = $false     # Boolean or connection object?
$admin = $true          # Boolean or user object?
$valid = $false         # Boolean or validation result?
$exists = $false        # Boolean or existence object?
```

## Good

```powershell
$isEnabled = $true
$isRunning = $true
$isConnected = $false
$isAdmin = $true
$isValid = $false
$hasChildren = $true
$hasErrors = $false
$shouldContinue = $true
$shouldRetry = $false
$canExecute = $true
$canDelete = $false
```

## Boolean Naming Patterns

```powershell
# Is — state check
$isAdministrator = ([Security.Principal.WindowsPrincipal]::new(
    [Security.Principal.WindowsIdentity]::GetCurrent()
)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# Has — ownership/containment
$hasRequiredModules = -not (Get-Module -ListAvailable Az, Pester)
$hasNetworkAccess = Test-Connection 8.8.8.8 -Quiet

# Should — intent/recommendation
$shouldReboot = (Get-Item 'HKLM:\SOFTWARE\...').GetValue('PendingFileRenameOperations')
$shouldNotify = $changes.Count -gt 0

# Can — capability check
$canUseParallel = $PSVersionTable.PSVersion.Major -ge 7
$canConnect = Test-PortOpen -ComputerName $server -Port 443
```

## See Also

- [name-variables-camelCase](name-variables-camelCase.md) - Variable naming
- [name-constants-UPPER_SNAKE](name-constants-UPPER_SNAKE.md) - Constants
