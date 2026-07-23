# mod-module-scope-variables

> Use Script scope for module-internal variables

## Why It Matters

Module-level variables should use the `$script:` scope to be accessible throughout the `.psm1` file but invisible outside the module. Without explicit scoping, variables can leak to the global scope or be accidentally shadowed. The script scope is the module's private namespace.

## Bad

```powershell
# MyModule.psm1
$connectionPool = @{}  # Leaks if not scoped

function Connect-Database {
    param($ConnectionString)
    $connectionPool[$ConnectionString] = New-DbConnection $ConnectionString
}

function Disconnect-Database {
    param($ConnectionString)
    # $connectionPool might not be in scope here
    if ($connectionPool[$ConnectionString]) {
        $connectionPool[$ConnectionString].Close()
    }
}
```

## Good

```powershell
# MyModule.psm1
$script:connectionPool = @{}     # Module-internal state
$script:initialized = $false     # Module flag

function Initialize-MyModule {
    [CmdletBinding()]
    param()

    if ($script:initialized) { return }

    $script:connectionPool = @{}
    $script:config = Get-Content config.json | ConvertFrom-Json
    $script:initialized = $true
    Write-Verbose 'Module initialized'
}

function Connect-Database {
    [CmdletBinding()]
    param($ConnectionString)

    if (-not $script:connectionPool[$ConnectionString]) {
        $script:connectionPool[$ConnectionString] = New-DbConnection $ConnectionString
    }
    return $script:connectionPool[$ConnectionString]
}
```

## Module Scope Hierarchy

```powershell
# $global: — visible everywhere (DON'T use in modules)
# $script: — visible within this .psm1, hidden outside (USE for module state)
# $local:  — visible only in current scope, default (no prefix needed for locals)

# Module state example
$script:cache = @{}
$script:logger = [Logger]::new()

function Get-CachedValue {
    param($Key)
    $local:now = Get-Date  # Local to this function invocation
    return $script:cache[$Key]
}
```

## See Also

- [mod-exported-functions](mod-exported-functions.md) - Public API control
- [anti-global-variables](anti-global-variables.md) - Don't use global scope
