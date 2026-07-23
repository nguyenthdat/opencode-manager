# anti-global-variables

> Don't use \$global: scope in modules

## Why It Matters

`$global:` variables leak into the user's session, cause naming collisions between modules, and create hidden dependencies that break when module order changes. Module state should use the `$script:` scope — visible within the `.psm1` but invisible to consumers. Global variables are the enemy of encapsulation.

## Bad

```powershell
# MyModule.psm1 — leaks global state
$global:ModuleConfig = Get-Content config.json | ConvertFrom-Json
$global:DbConnection = Connect-Database

function Get-Data { param($Id)
    $global:DbConnection.Query("SELECT * FROM data WHERE Id = $Id")
}
# $ModuleConfig and $DbConnection leak into user's session
# Another module also creates $global:DbConnection — collision!
```

## Good

```powershell
# MyModule.psm1 — encapsulated state
$script:config = Get-Content config.json | ConvertFrom-Json
$script:connection = $null

function Connect-MyModule {
    [CmdletBinding()]
    param()

    if (-not $script:connection) {
        $script:connection = Connect-Database $script:config.ConnectionString
    }
    return $script:connection
}

function Get-Data {
    [CmdletBinding()]
    param($Id)

    $conn = Connect-MyModule
    $conn.Query("SELECT * FROM data WHERE Id = $Id")
}
# Nothing leaks to user session
```

## Scope Reference

```powershell
# $global:    — visible everywhere, NEVER use in modules
# $script:    — visible within this .psm1, USE for module state
# $local:     — default, current scope only
# $private:   — current scope, not visible to child scopes

# In a module, always:
$script:cache = @{}                    # Module-level cache
$script:initialized = $false           # Module flag

function Get-ModuleState {
    $script:initialized                # Access module state
}

function Set-ModuleState {
    $script:initialized = $true        # Modify module state
}
```

## See Also

- [mod-module-scope-variables](mod-module-scope-variables.md) - Module scope
- [mod-private-functions](mod-private-functions.md) - Private functions
