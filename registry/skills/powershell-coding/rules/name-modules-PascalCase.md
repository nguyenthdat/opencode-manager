# name-modules-PascalCase

> PascalCase for module names

## Why It Matters

Module names like `AzureAD`, `PSReadLine`, and `Pester` use PascalCase — consistent with .NET and PowerShell naming conventions. Module names become type names when you reference `[ModuleName.ClassName]`, so PascalCase prevents awkward type expressions. kebab-case module names look foreign in PowerShell.

## Bad

```powershell
# kebab-case modules
PS> Install-Module my-data-tools
PS> Import-Module my-data-tools  # Feels like a Linux package, not PowerShell

# All lowercase
PS> Install-Module datatools
PS> [datatools.DataHelper]::new()  # Awkward
```

## Good

```powershell
# PascalCase modules
PS> Install-Module MyDataTools
PS> Import-Module MyDataTools
PS> [MyDataTools.DataHelper]::new()  # Clean

# Descriptive, recognizable names
Install-Module PSWorkflow
Install-Module VMwarePowerCLI
Install-Module SqlServer
Install-Module AzCompute
```

## Module Naming Guidelines

```powershell
# Good module names:
MyDataTools          # Simple descriptive PascalCase
PSLogAnalytics       # PS-prefixed for PowerShell-specific tools
AzDataLake           # Short vendor/category prefix
VMwareAutomation     # Organization prefix

# Avoid:
my-data-tools        # kebab-case — not PowerShell style
mydatatools          # All lowercase — hard to read
My.Data.Tools        # Dots — confusing with namespace syntax
My_Data_Tools        # Underscores — non-standard
```

## See Also

- [name-scripts-kebab-case](name-scripts-kebab-case.md) - Script file naming
- [proj-ps1-psm1-separate](proj-ps1-psm1-separate.md) - Script vs module
