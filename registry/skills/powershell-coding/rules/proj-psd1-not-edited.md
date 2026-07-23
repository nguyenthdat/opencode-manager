# proj-psd1-not-edited

> Don't manually edit .psd1 files; use Update-ModuleManifest

## Why It Matters

Manually editing `.psd1` manifests leads to syntax errors, inconsistent formatting, and missing required fields. `Update-ModuleManifest` and `New-ModuleManifest` generate valid, consistently-formatted manifests. Manual edits are fragile — a missing comma or brace breaks module loading.

## Bad

```powershell
# Hand-edited .psd1 — fragile and error-prone
@{
    RootModule = 'MyModule.psm1'
    ModuleVersion = '1.0.0'
    GUID = 'a1b2c3d4-...
    Author = 'Jane Doe'
    FunctionsToExport = @('Get-Data', 'Set-Data')  # Easy to miss comma, forget closing brace
```

## Good

```powershell
# Generate manifest fresh
New-ModuleManifest -Path ./MyModule/MyModule.psd1 `
    -RootModule 'MyModule.psm1' `
    -ModuleVersion '1.0.0' `
    -Author 'Jane Doe' `
    -CompanyName 'Corp Inc' `
    -Description 'Data processing module' `
    -PowerShellVersion '7.4' `
    -FunctionsToExport @('Get-Data', 'Set-Data') `
    -CmdletsToExport @() `
    -VariablesToExport @() `
    -AliasesToExport @() `
    -RequiredModules @(
        @{ ModuleName = 'Az.Accounts'; ModuleVersion = '2.12.0' }
    )

# Update existing manifest
Update-ModuleManifest -Path ./MyModule/MyModule.psd1 `
    -ModuleVersion '1.1.0' `
    -FunctionsToExport @('Get-Data', 'Set-Data', 'Remove-Data')
```

## Build Script Integration

```powershell
# In build.ps1 — generate manifest from source of truth
$version = Get-Content VERSION -Raw
$functions = Get-ChildItem ./MyModule/Public/*.ps1 | ForEach-Object { $_.BaseName }

New-ModuleManifest -Path ./MyModule/MyModule.psd1 `
    -ModuleVersion $version.Trim() `
    -FunctionsToExport $functions `
    # ... other metadata from build variables
```

## See Also

- [proj-source-control-psm1](proj-source-control-psm1.md) - Source control strategy
- [mod-psm1-psd1](mod-psm1-psd1.md) - Separate code from manifest
