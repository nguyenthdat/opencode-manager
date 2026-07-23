# cmd-single-responsibility

> Each function does one thing well

## Why It Matters

Small, focused functions are easier to test, debug, and reuse. When a function does multiple unrelated things, it becomes hard to understand, test in isolation, or compose with other functions. PowerShell's pipeline naturally composes small functions.

## Bad

```powershell
function Invoke-UserCleanup {
    param($Days)

    # Does 4 unrelated things
    $oldUsers = Get-ADUser -Filter "LastLogonDate -lt (Get-Date).AddDays(-$Days)"
    foreach ($user in $oldUsers) {
        Disable-ADAccount $user
    }
    $report = $oldUsers | Select-Object Name, SamAccountName | Export-Csv report.csv
    Send-MailMessage -To admin@corp.com -Subject "Cleanup Report" -Body "See attached" -Attachments report.csv
}
```

## Good

```powershell
function Get-StaleUsers {
    [CmdletBinding()]
    param([int]$Days = 90)

    Get-ADUser -Filter "LastLogonDate -lt (Get-Date).AddDays(-$Days)"
}

function Disable-StaleUsers {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(ValueFromPipeline)]
        [Microsoft.ActiveDirectory.Management.ADUser]$User
    )

    process {
        if ($PSCmdlet.ShouldProcess($User.SamAccountName)) {
            Disable-ADAccount $User
        }
    }
}

function Send-CleanupReport {
    param(
        [Parameter(ValueFromPipeline)]
        [psobject[]]$Users
    )

    end {
        $csvPath = "cleanup-$(Get-Date -Format yyyyMMdd).csv"
        $Users | Export-Csv $csvPath
        Send-MailMessage -To admin@corp.com -Subject "Cleanup" -Attachments $csvPath
    }
}

# Compose in pipeline
Get-StaleUsers -Days 90 | Disable-StaleUsers -WhatIf | Send-CleanupReport
```

## See Also

- [cmd-consistent-output](cmd-consistent-output.md) - Consistent output types
- [cmd-approved-verbs](cmd-approved-verbs.md) - Approved verbs
