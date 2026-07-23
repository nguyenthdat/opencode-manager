# proj-ps1-psm1-separate

> Separate scripts (.ps1) from modules (.psm1)

## Why It Matters

Scripts (`.ps1`) are executed directly, run once, and exit. Modules (`.psm1`) are imported, persist in the session, and export reusable functions. Mixing them confuses users (should I run or import this?), complicates testing, and creates accidental side effects when a script is dot-sourced.

## Bad

```
MyProject/
├── functions.ps1            # Is this a module or a script?
├── deploy-functions.psm1    # Module that also deploys on import?
└── utilities.ps1            # Dot-sourced everywhere — side effects
```

## Good

```
MyProject/
├── MyModule/                # Module — imports, exports functions
│   ├── MyModule.psd1
│   ├── MyModule.psm1
│   ├── Public/
│   │   └── Get-Data.ps1
│   └── Private/
│       └── Connect-Api.ps1
├── scripts/                 # Scripts — executed directly
│   ├── deploy.ps1
│   ├── backup-database.ps1
│   └── generate-report.ps1
└── build.ps1                # Build script
```

## Script Uses Module

```powershell
# scripts/deploy.ps1 — imports module, uses its functions
[System.Environment]::SetEnvironmentVariable('APP_ENV', 'production')
Import-Module "$PSScriptRoot/../MyModule/MyModule.psd1"

Connect-MyApi
$result = Get-Data -Environment production

if ($result.Status -eq 'Ready') {
    Invoke-Deployment
}
```

## Module Never Scripts

```powershell
# BAD: Module that does work on import
# MyModule.psm1
Write-Host "Starting MyModule..."  # Side effect on import!
Connect-Database                   # Side effect on import!
$script:Session = New-Session      # Side effect on import!

# GOOD: Module exports functions, no side effects on import
# MyModule.psm1
function Connect-MyDatabase { ... }
function Get-MyData { ... }
Export-ModuleMember -Function Connect-MyDatabase, Get-MyData
```

## See Also

- [name-scripts-kebab-case](name-scripts-kebab-case.md) - Script naming
- [mod-root-module-single](mod-root-module-single.md) - Module structure
