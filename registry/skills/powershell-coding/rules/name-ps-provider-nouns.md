# name-ps-provider-nouns

> Match PSProvider nouns when creating new providers

## Why It Matters

When extending a PowerShell provider (e.g., a custom PSDrive), the noun in your cmdlet names should match the PSProvider noun. This makes your cmdlets discoverable alongside built-in provider cmdlets and creates a consistent mental model for users.

## Bad

```powershell
# Registry provider cmdlets: Get-ItemProperty, Set-ItemProperty
# Custom registry-like provider with mismatched nouns:
function Get-RegistryValue { ... }     # Should be Get-ItemProperty
function Set-RegistryData { ... }      # Should be Set-ItemProperty
function Remove-RegistryKey { ... }    # Should be Remove-Item
```

## Good

```powershell
# Match standard provider nouns
# FileSystem: Get-Item, Set-Content, Get-ChildItem
# Registry:   Get-ItemProperty, Set-ItemProperty
# Certificate: Get-ChildItem, Get-Item
# Variable:   Get-Variable, Set-Variable

# Custom database provider
function Get-DBItem {
    [CmdletBinding()]
    param($Path)
    # Navigate database hierarchy
}

function Set-DBItemProperty {
    [CmdletBinding()]
    param($Path, $Name, $Value)
    # Set database field
}

function Get-DBChildItem {
    [CmdletBinding()]
    param($Path)
    # List table rows, collection children
}
```

## Provider Cmdlet Mapping

```powershell
# Standard provider cmdlets to implement:
Get-Item           # Retrieve an item
Set-Item           # Update an item
New-Item           # Create an item
Remove-Item        # Delete an item
Get-ChildItem      # List children
Get-ItemProperty   # Get a property of an item
Set-ItemProperty   # Set a property of an item
Get-Content        # Read content
Set-Content        # Write content
Test-Path          # Check if path exists

# Prefix with provider noun: Get-DBItem, Set-DBContent, etc.
```

## See Also

- [cmd-approved-verbs](cmd-approved-verbs.md) - Approved verbs
- [cmd-singular-nouns](cmd-singular-nouns.md) - Singular nouns
