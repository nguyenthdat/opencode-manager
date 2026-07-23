# param-parameter-sets

> Use parameter sets for mutually exclusive params

## Why It Matters

Parameter sets enforce compile-time constraints on which parameter combinations are valid, preventing runtime errors from invalid combinations. They also allow tab completion to show contextually relevant parameters and enable the function to behave differently based on which parameter set was used.

## Bad

```powershell
function Get-UserInfo {
    param(
        [string]$UserId,        # Can specify both
        [string]$Username       # Leading to ambiguous intent
    )

    # Manual validation of mutually exclusive parameters
    if ($UserId -and $Username) {
        throw 'Specify either UserId OR Username, not both'
    }
    if (-not $UserId -and -not $Username) {
        throw 'Must specify UserId or Username'
    }
}
```

## Good

```powershell
function Get-UserInfo {
    [CmdletBinding(DefaultParameterSetName = 'ById')]
    param(
        [Parameter(Mandatory, ParameterSetName = 'ById')]
        [int]$UserId,

        [Parameter(Mandatory, ParameterSetName = 'ByName')]
        [string]$Username
    )

    # PowerShell enforces mutual exclusivity — clean body
    switch ($PSCmdlet.ParameterSetName) {
        'ById'   { Get-ADUser -Identity $UserId }
        'ByName' { Get-ADUser -Filter "SamAccountName -eq '$Username'" }
    }
}

# Tab completion only shows relevant params:
Get-UserInfo -UserId 1234
Get-UserInfo -Username jdoe
Get-UserInfo -UserId 1234 -Username jdoe  # Error: parameter set ambiguity
```

## Reference

```powershell
function Send-Notification {
    [CmdletBinding(DefaultParameterSetName = 'Email')]
    param(
        [Parameter(Mandatory)]
        [string]$Message,

        [Parameter(Mandatory, ParameterSetName = 'Email')]
        [string]$To,

        [Parameter(ParameterSetName = 'Email')]
        [string]$Subject = 'Notification',

        [Parameter(Mandatory, ParameterSetName = 'Slack')]
        [string]$Channel,

        [Parameter(ParameterSetName = 'Slack')]
        [switch]$MentionEveryone,

        # Shared across all parameter sets
        [Parameter(ParameterSetName = 'Email')]
        [Parameter(ParameterSetName = 'Slack')]
        [ValidateSet('Low', 'Normal', 'High')]
        [string]$Priority = 'Normal'
    )
}
```

## See Also

- [param-mandatory-explicit](param-mandatory-explicit.md) - Mark mandatory
- [param-default-values](param-default-values.md) - Default values
