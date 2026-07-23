# mod-root-module-single

> Use a single .psm1 root module with dot-sourcing

## Why It Matters

A single `.psm1` root file that dot-sources other `.ps1` files keeps your module organized while maintaining a clean entry point. Each public and private function lives in its own file, making code review, testing, and maintenance straightforward. The root module is thin — it just wires everything together.

## Bad

```powershell
# Monolithic .psm1 — 3000 lines
# MyModule.psm1
function Get-User { ... }       # Line 1-50
function New-User { ... }       # Line 51-120
function _validateEmail { ... } # Line 121-150
function _connectDb { ... }     # Line 151-200
function Set-User { ... }       # Line 201-300
# ... 2700 more lines
```

## Good

```powershell
# MyModule.psm1 — thin root, just dot-sources
$public  = Join-Path $PSScriptRoot 'Public'
$private = Join-Path $PSScriptRoot 'Private'

# Dot-source private functions first (public may depend on them)
Get-ChildItem "$private/*.ps1" | ForEach-Object {
    . $_.FullName
    Write-Debug "Loaded private: $($_.Name)"
}

# Dot-source public functions
Get-ChildItem "$public/*.ps1" | ForEach-Object {
    . $_.FullName
    Write-Debug "Loaded public: $($_.Name)"
}

# Export only public functions
Export-ModuleMember -Function (Get-ChildItem "$public/*.ps1").BaseName

# Public/Get-User.ps1
function Get-User { [CmdletBinding()] param($Id) ... }

# Public/New-User.ps1
function New-User { [CmdletBinding()] param($Name) ... }

# Private/Format-Username.ps1
function Format-Username { param($Raw) $Raw.Trim().ToLower() }

# Private/Connect-Db.ps1
function Connect-Db { param($ConnectionString) ... }
```

## Enhanced Root Module

```powershell
# MyModule.psm1
[CmdletBinding()]
param()

$script:ModulePath = $PSScriptRoot

# Load order matters — internals first
$loadOrder = @(
    'Private\_Logger.ps1'       # Logging infrastructure
    'Private\_Config.ps1'       # Configuration
    'Private\*.ps1'             # All other private
    'Public\*.ps1'              # All public
)

foreach ($pattern in $loadOrder) {
    $files = Get-ChildItem (Join-Path $script:ModulePath $pattern) -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        . $file.FullName
    }
}

Export-ModuleMember -Function (Get-ChildItem "$script:ModulePath/Public/*.ps1").BaseName
```

## See Also

- [proj-public-private-dirs](proj-public-private-dirs.md) - Directory layout
- [mod-exported-functions](mod-exported-functions.md) - Export control
