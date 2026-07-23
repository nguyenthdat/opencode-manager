# param-validate-attribute

> Use [ValidateNotNullOrEmpty()], [ValidateSet()], etc.

## Why It Matters

PowerShell's validation attributes provide declarative input validation that runs before your function body, giving users clear, immediate error messages. Manual validation clutters your code with repetitive checks. Built-in validators cover the most common cases and are consistently enforced.

## Bad

```powershell
function Set-UserRole {
    param($Username, $Role)

    if ([string]::IsNullOrWhiteSpace($Username)) {
        throw 'Username is required'
    }
    if ($Role -ne 'Admin' -and $Role -ne 'User' -and $Role -ne 'Guest') {
        throw "Invalid role: $Role. Must be Admin, User, or Guest"
    }
}
```

## Good

```powershell
function Set-UserRole {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [string]$Username,

        [Parameter(Mandatory)]
        [ValidateSet('Admin', 'User', 'Guest')]
        [string]$Role
    )

    # Validation already done — clean function body
    Write-Verbose "Setting $Username to $Role"
}
```

## Available Validation Attributes

```powershell
function Invoke-ValidatedOperation {
    param(
        # Not null or empty
        [ValidateNotNullOrEmpty()][string]$Path,

        # Not null
        [ValidateNotNull()][object]$Config,

        # Within range
        [ValidateRange(1, 65535)][int]$Port = 443,

        # Match pattern
        [ValidatePattern('^[a-z0-9-]+$')][string]$Name,

        # Length constraint
        [ValidateLength(3, 50)][string]$DisplayName,

        # Count constraint (arrays)
        [ValidateCount(1, 10)][string[]]$Servers,

        # From allowed set
        [ValidateSet('Tcp', 'Udp')][string]$Protocol,

        # Script-based
        [ValidateScript({ Test-Path $_ })]
        [string]$FilePath,

        # Trusted data (newlines allowed)
        [ValidateTrustedData()][string]$MultilineInput
    )
}
```

## See Also

- [param-validate-script](param-validate-script.md) - Complex validation
- [param-typed-parameters](param-typed-parameters.md) - Type declarations
