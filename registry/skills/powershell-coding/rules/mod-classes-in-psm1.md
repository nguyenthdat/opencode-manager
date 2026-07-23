# mod-classes-in-psm1

> Define PowerShell classes in .psm1 for module scoping

## Why It Matters

PowerShell classes defined in a `.psm1` file are scoped to that module — they don't leak into the global session. This prevents type name collisions between modules and keeps implementation details private. Classes defined in `.ps1` scripts or dot-sourced files pollute the global scope.

## Bad

```powershell
# MyModule.ps1 (script, not module)
class User {
    [string]$Name
    [string]$Email
}

# Runs in global scope — User type collides with other modules
. ./MyModule.ps1
# $global:User is now defined — conflicts with everything
```

## Good

```powershell
# MyModule.psm1
class User {
    [string]$Name
    [string]$Email
    [DateTime]$CreatedAt

    User([string]$name, [string]$email) {
        $this.Name = $name
        $this.Email = $email
        $this.CreatedAt = Get-Date
    }

    [string] ToJson() {
        return ConvertTo-Json $this
    }
}

function New-User {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name,

        [Parameter(Mandatory)]
        [string]$Email
    )

    return [User]::new($Name, $Email)
}

# User type is scoped to MyModule — no global leak
```

## Class Limitations in PowerShell

```powershell
# Known limitations with PowerShell classes:
# 1. Classes are loaded at parse time (before script execution)
# 2. Cannot use [CmdletBinding()] in class methods
# 3. No constructor overloading with different signatures (use static factory methods)
# 4. Limited inheritance — single parent only

class ConfigManager {
    static [ConfigManager] FromFile([string]$path) {
        $instance = [ConfigManager]::new()
        $instance.Load($path)
        return $instance
    }

    static [ConfigManager] FromJson([string]$json) {
        $instance = [ConfigManager]::new()
        $instance.Parse($json)
        return $instance
    }
}
```

## See Also

- [mod-script-module-over-binary](mod-script-module-over-binary.md) - Script vs binary modules
- [mod-root-module-single](mod-root-module-single.md) - Single root module
