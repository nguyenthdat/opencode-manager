# cmd-should-process

> Support -WhatIf and -Confirm with SupportsShouldProcess

## Why It Matters

`SupportsShouldProcess` gives users safety with `-WhatIf` (preview what a command would do) and `-Confirm` (prompt before taking action). This is essential for destructive operations like Remove-*, Stop-*, or Set-* that modify state. Users expect this behavior because built-in cmdlets provide it.

## Bad

```powershell
function Remove-StaleAccounts {
    [CmdletBinding()]
    param($DaysOld)

    # Destructive — no safety net
    Get-ADUser -Filter "LastLogonDate -lt (Get-Date).AddDays(-$DaysOld)" |
        Remove-ADUser  # Immediate deletion, no confirmation
}
```

## Good

```powershell
function Remove-StaleAccounts {
    [CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
    param(
        [Parameter(Mandatory)]
        [int]$DaysOld
    )

    $staleUsers = Get-ADUser -Filter "LastLogonDate -lt (Get-Date).AddDays(-$DaysOld)"

    foreach ($user in $staleUsers) {
        if ($PSCmdlet.ShouldProcess(
            "User '$($user.SamAccountName)'",
            "Remove from Active Directory",
            "This permanently deletes the user account"
        )) {
            Remove-ADUser -Identity $user.SamAccountName
            Write-Verbose "Removed $($user.SamAccountName)"
        }
    }
}

# Usage:
Remove-StaleAccounts -DaysOld 90 -WhatIf   # Shows what would happen
Remove-StaleAccounts -DaysOld 90 -Confirm  # Prompts for each user
```

## ConfirmImpact Levels

```powershell
# Low — minor changes, no confirmation by default
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'Low')]
function Write-LogEntry { ... }

# Medium — default, prompts when $ConfirmPreference = 'Medium'
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'Medium')]
function Set-ConfigValue { ... }

# High — destructive, prompts when $ConfirmPreference = 'High'
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
function Remove-Database { ... }
```

## See Also

- [anti-no-whatif](anti-no-whatif.md) - Don't skip WhatIf
- [cmd-support-common](cmd-support-common.md) - Common parameters
