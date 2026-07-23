# mod-version-semantic

> Use semantic versioning in module manifests

## Why It Matters

Semantic versioning (SemVer) communicates the nature of changes to consumers: MAJOR (breaking), MINOR (new features, backward-compatible), PATCH (bug fixes). PowerShellGet and module update mechanisms depend on version numbers to determine update eligibility. Inconsistent versioning breaks `Update-Module` and confuses users.

## Bad

```powershell
# Arbitrary versions — no meaning
@{
    ModuleVersion = '1'
    ModuleVersion = '1.0.0.0'  # 4-part version — not SemVer
    ModuleVersion = '5'        # What changed from 4?
}

# Breaking change in patch version
# 1.0.0 → 1.0.1 (but we removed a parameter!) — breaks consumers
```

## Good

```powershell
@{
    # MAJOR.MINOR.PATCH
    ModuleVersion = '1.0.0'     # Initial release
    ModuleVersion = '1.1.0'     # New Get-User -IncludeDeleted parameter (backward compatible)
    ModuleVersion = '1.1.1'     # Fixed bug in Get-User parameter validation
    ModuleVersion = '2.0.0'     # Breaking: removed -LegacyMode, renamed Get-User to Get-UserAccount
}

# Prerelease versions (PS 5.1+)
@{
    ModuleVersion = '2.0.0'
    PrivateData   = @{
        PSData = @{
            Prerelease = 'beta1'   # 2.0.0-beta1
            Prerelease = 'rc2'     # 2.0.0-rc2
        }
    }
}
```

## Version Lifecycle

```powershell
# SemVer examples
'1.0.0'            # Stable release
'1.0.0-beta1'      # First beta of 1.0.0
'1.0.0-rc1'        # First release candidate
'2.0.0-preview.3'  # Third preview of 2.0.0

# Update-Module behavior:
# 1.0.0 → Update-Module → 1.1.0 (compatible update)
# 1.1.0 → Update-Module → 2.0.0 (major update, user must confirm)
```

## See Also

- [mod-psm1-psd1](mod-psm1-psd1.md) - Separate code from manifest
- [mod-dependency-declare](mod-dependency-declare.md) - RequiredModules
