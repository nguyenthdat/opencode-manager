# doc-comment-based-help

> Use <\# ... \#> comment-based help for all functions

## Why It Matters

Comment-based help makes `Get-Help YourFunction` work — the primary discovery mechanism for PowerShell users. Without it, users can't see what your function does, what parameters it accepts, or see examples. Every exported function in a module must have comment-based help.

## Bad

```powershell
function Get-User {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Identity,

        [string[]]$Properties
    )

    # No help — Get-Help Get-User shows nothing useful
    process { ... }
}
```

## Good

```powershell
<#
.SYNOPSIS
    Retrieves user information from Active Directory.

.DESCRIPTION
    The Get-User cmdlet retrieves one or more user objects from Active Directory.
    You can specify users by SamAccountName, DistinguishedName, or GUID.
    By default, only common properties are returned. Use -Properties to request
    additional attributes.

.PARAMETER Identity
    Specifies the user to retrieve. Accepts SamAccountName, DistinguishedName,
    or object GUID.

.PARAMETER Properties
    Specifies additional AD properties to include in the output. Common properties
    (Name, SamAccountName, Email, Enabled) are always returned.

.EXAMPLE
    Get-User -Identity jdoe
    Retrieves the user with SamAccountName 'jdoe'.

.EXAMPLE
    Get-User -Identity jdoe -Properties Department, Title, Manager
    Retrieves 'jdoe' with additional Department, Title, and Manager properties.

.EXAMPLE
    'jdoe', 'asmith' | Get-User
    Retrieves multiple users via pipeline input.

.INPUTS
    System.String
    You can pipe a string containing a SamAccountName to Get-User.

.OUTPUTS
    PSCustomObject
    Returns a custom object with user properties.

.NOTES
    Requires the ActiveDirectory module.
    Author: Jane Doe

.LINK
    Get-ADUser
    Set-User
#>
function Get-User {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [string]$Identity,

        [string[]]$Properties
    )
    process { ... }
}
```

## Minimum Required Sections

```powershell
<#
.SYNOPSIS       # REQUIRED — one-line summary
.DESCRIPTION    # REQUIRED — detailed description
.PARAMETER x    # REQUIRED — one per parameter
.EXAMPLE        # REQUIRED — at least one
#>
```

## See Also

- [doc-synopsis-description](doc-synopsis-description.md) - Synopsis and Description
- [doc-parameter-help](doc-parameter-help.md) - Parameter documentation
- [doc-examples-section](doc-examples-section.md) - Examples
