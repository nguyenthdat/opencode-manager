# proj-public-private-dirs

> Use Public/ and Private/ directories in modules

## Why It Matters

Separating `Public/` (exported cmdlets) from `Private/` (internal helpers) makes the module's API boundary crystal clear. Anyone can see what's public and what's internal by looking at directories. The root `.psm1` dot-sources `Private/` first (because public functions depend on private ones), then `Public/`, then exports only the public functions.

## Bad

```
MyModule/
├── MyModule.psd1
├── MyModule.psm1       # Monolithic — all functions here
└── Functions/           # Mixed public/private — unclear boundary
    ├── Get-Data.ps1     # Public
    ├── Format-Output.ps1 # Private helper
    ├── Connect-Api.ps1   # Private
    └── Set-Data.ps1      # Public
```

## Good

```
MyModule/
├── MyModule.psd1
├── MyModule.psm1
├── Public/
│   ├── Get-Data.ps1
│   └── Set-Data.ps1
└── Private/
    ├── Connect-Api.ps1
    └── Format-Output.ps1
```

## Root Module Wiring

```powershell
# MyModule.psm1
$script:ModuleRoot = $PSScriptRoot

# Load internals first
Get-ChildItem "$script:ModuleRoot/Private/*.ps1" -Recurse |
    ForEach-Object { . $_.FullName }

# Load public functions
Get-ChildItem "$script:ModuleRoot/Public/*.ps1" -Recurse |
    ForEach-Object { . $_.FullName }

# Export only public
$publicFunctions = Get-ChildItem "$script:ModuleRoot/Public/*.ps1" -Recurse |
    ForEach-Object { $_.BaseName }

Export-ModuleMember -Function $publicFunctions
```

## See Also

- [proj-module-layout](proj-module-layout.md) - Module layout
- [mod-private-functions](mod-private-functions.md) - Private function conventions
