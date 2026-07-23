# param-no-position-binding

> Don't rely on positional parameters in public functions

## Why It Matters

Positional parameters force users to remember argument order, leading to subtle bugs when arguments are swapped. Named parameters are self-documenting and unambiguous. In scripts and public modules, always require users to specify parameter names for clarity and safety.

## Bad

```powershell
function Add-User {
    param(
        [string]$Username,      # Position 1
        [string]$Department,    # Position 2
        [string]$Role           # Position 3
    )
}

# User calls: order matters — bug-prone
Add-User Sales Admin jdoe           # Did I get order right?
Add-User jdoe Admin Sales           # Oops — swapped Department and Role
# User meant: Username=jdoe, Department=Sales, Role=Admin
# Actual:     Username=Sales, Department=Admin, Role=jdoe
```

## Good

```powershell
function Add-User {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Username,

        [Parameter(Mandatory)]
        [string]$Department,

        [Parameter(Mandatory)]
        [string]$Role
    )

    # Named — impossible to get wrong
}
# With CmdletBinding(), PowerShell won't positionally bind
# Users must use named parameters:
Add-User -Username jdoe -Department Sales -Role Admin  # Clear and safe
```

## When Positional Is OK

```powershell
# Private/helper functions — positional is fine
function _parseKeyValuePair($key, $value) {
    [PSCustomObject]@{ Key = $key; Value = $value }
}

# Pipeline-aware parameters with clear single purpose
function Get-SquareRoot {
    param(
        [Parameter(ValueFromPipeline)]
        [double]$Number
    )
    # This is a pipeline function — the type is clear
}
```

## See Also

- [param-named-params](param-named-params.md) - Pass by name
- [name-parameters-PascalCase](name-parameters-PascalCase.md) - Parameter naming
