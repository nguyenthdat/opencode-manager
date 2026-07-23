# mod-psm1-psd1

> Separate module code (.psm1) from manifest (.psd1)

## Why It Matters

The `.psm1` contains the module's code — functions, variables, initialization logic. The `.psd1` is a data file declaring metadata: version, author, exported functions, dependencies. Mixing logic into the manifest creates unmaintainable modules. Separating them enables tooling (like `Update-ModuleManifest`) to safely modify metadata without touching code.

## Bad

```powershell
# Single .psm1 with embedded metadata — no manifest
# MyModule.psm1
$ModuleVersion = '1.2.3'
$Author = 'Jane Doe'
$Description = 'A great module'

function Get-Data { ... }
Export-ModuleMember -Function 'Get-Data'
```

## Good

```powershell
# MyModule.psd1 — manifest (data only)
@{
    RootModule           = 'MyModule.psm1'
    ModuleVersion        = '1.2.3'
    GUID                 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    Author               = 'Jane Doe'
    CompanyName          = 'Corp Inc'
    Copyright            = '(c) 2024 Corp Inc. All rights reserved.'
    Description          = 'Provides data retrieval and processing cmdlets'
    PowerShellVersion    = '7.4'
    FunctionsToExport    = @('Get-Data', 'Set-Data', 'Remove-Data')
    CmdletsToExport      = @()
    VariablesToExport    = @()
    AliasesToExport      = @()
    PrivateData          = @{
        PSData = @{
            Tags       = @('Data', 'Processing')
            LicenseUri = 'https://opensource.org/licenses/MIT'
            ProjectUri = 'https://github.com/janedoe/MyModule'
        }
    }
}

# MyModule.psm1 — module code only
function Get-Data { [CmdletBinding()] param($Id) ... }
function Set-Data { [CmdletBinding()] param($Id, $Value) ... }
function Remove-Data { [CmdletBinding()] param($Id) ... }
```

## See Also

- [mod-exported-functions](mod-exported-functions.md) - FunctionsToExport
- [mod-version-semantic](mod-version-semantic.md) - Semantic versioning
