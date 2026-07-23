# param-typed-parameters

> Use [type] declarations for all parameters

## Why It Matters

Typed parameters enforce type safety at the function boundary — PowerShell automatically coerces or rejects mismatched arguments before your code runs. Untyped parameters accept anything, requiring manual type checking scattered through your function body. Types also enable tab completion and better error messages.

## Bad

```powershell
function Set-Threshold {
    param($Value, $Enabled)

    # Manual type checking everywhere
    if ($Value -isnot [int]) { throw "Value must be an integer" }
    if ($Enabled -isnot [bool]) {
        $Enabled = $Enabled -eq 'true'  # Guessing coercion
    }
}
Set-Threshold -Value "abc" -Enabled "yes"  # No error on call — boom inside
```

## Good

```powershell
function Set-Threshold {
    param(
        [int]$Value,
        [bool]$Enabled
    )
    # $Value is guaranteed int, $Enabled guaranteed bool
}
Set-Threshold -Value "abc" -Enabled "yes"
# Error: Cannot convert value "abc" to type "System.Int32"
```

## Commonly Used Types

```powershell
function Invoke-ApiCall {
    param(
        [string]$Uri,                    # String
        [int]$TimeoutSeconds = 30,       # Integer
        [double]$RetryMultiplier = 1.5,  # Float
        [bool]$UseSsl = $true,           # Boolean
        [switch]$Force,                  # Switch (boolean flag)
        [string[]]$Headers,              # String array
        [hashtable]$Body,                # Hashtable
        [scriptblock]$RetryLogic,        # Script block
        [pscredential]$Credential,       # PSCredential
        [datetime]$NotBefore,            # DateTime
        [uri]$BaseUri,                   # URI
        [System.IO.FileInfo]$CertFile    # .NET type
    )
}
```

## See Also

- [param-validate-attribute](param-validate-attribute.md) - Validation attributes
- [param-mandatory-explicit](param-mandatory-explicit.md) - Mark required params
