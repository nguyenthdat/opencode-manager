# anti-no-whatif

> Don't skip -WhatIf implementation for destructive commands

## Why It Matters

Users run `-WhatIf` before destructive operations to preview consequences — it's a fundamental PowerShell safety mechanism. Skipping `SupportsShouldProcess` on a function that deletes, modifies, or irreversibly changes state is irresponsible. Every destructive cmdlet should support `-WhatIf`.

## Bad

```powershell
function Remove-UserData {
    [CmdletBinding()]
    param([string]$UserId)

    # No ShouldProcess — no safety net
    Remove-Item "C:\UserData\$UserId" -Recurse -Force
    Remove-ADUser $UserId
    Remove-DatabaseRecord -Table Users -Id $UserId
}

# User runs:
Remove-UserData -UserId jdoe  # Immediate, irreversible deletion
# Wish they could see: "What would this actually DO?"
```

## Good

```powershell
function Remove-UserData {
    [CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
    param(
        [Parameter(Mandatory)]
        [string]$UserId
    )

    if ($PSCmdlet.ShouldProcess(
        "User '$UserId' and all associated data",
        "Permanently remove",
        "This action is IRREVERSIBLE. All user files, AD account, and database records will be deleted."
    )) {
        Remove-Item "C:\UserData\$UserId" -Recurse -Force
        Remove-ADUser $UserId
        Remove-DatabaseRecord -Table Users -Id $UserId

        Write-Verbose "Removed user $UserId and all data"
    }
}

# User runs:
Remove-UserData -UserId jdoe -WhatIf
# Output: "What if: Performing the operation 'Permanently remove' on target 'User jdoe and all associated data'."
```

## When to Implement

```powershell
# MUST support ShouldProcess:
# Remove-*, Disable-*, Stop-*, Set-* (when modifying), Clear-*, Reset-*
# Any function that deletes, modifies, or irreversibly changes state

# OK to skip ShouldProcess:
# Get-*, Test-*, Write-*, ConvertTo-*, Format-*, Select-*
# Read-only functions with no side effects
```

## See Also

- [cmd-should-process](cmd-should-process.md) - ShouldProcess implementation
- [anti-approve-all-confirm](anti-approve-all-confirm.md) - -Force abuse
