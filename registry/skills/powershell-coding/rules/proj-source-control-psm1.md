# proj-source-control-psm1

> Only commit .psm1 source; generate .psd1 fresh

## Why It Matters

`.psd1` manifests can be generated deterministically from source code. Committing generated files causes merge conflicts, stale metadata, and version skew. Only commit source files (`.psm1`, `.ps1`) and generate the manifest as part of the build. This keeps your repo clean and your manifest always accurate.

## Bad

```powershell
# Both committed — manifest conflicts on every merge
git add MyModule.psm1 MyModule.psd1
git commit -m "Update module"

# Manifest gets stale — dev forgets to update FunctionsToExport
# Merge conflict: Alice and Bob both changed ModuleVersion
# CI: manifest says 1.0.0 but FunctionsToExport lists functions from 1.1.0
```

## Good

```powershell
# .gitignore — only source committed
*.psd1  # Generated — not committed

# build.ps1 generates .psd1 from source
task GenerateManifest {
    $functions = Get-ChildItem ./MyModule/Public/*.ps1 |
        ForEach-Object { $_.BaseName }

    $version = Get-Content ./VERSION -Raw

    New-ModuleManifest -Path ./MyModule/MyModule.psd1 `
        -RootModule 'MyModule.psm1' `
        -ModuleVersion $version.Trim() `
        -FunctionsToExport $functions `
        # ... static metadata from build config
}

# For distribution: include generated .psd1 in the package
# For repo: never commit .psd1
```

## Alternative: Commit Both, Validate in CI

```powershell
# If your team prefers committing the manifest:
# CI validates manifest matches source
task ValidateManifest {
    $declared = (Import-PowerShellDataFile ./MyModule/MyModule.psd1).FunctionsToExport
    $actual = Get-ChildItem ./MyModule/Public/*.ps1 | ForEach-Object { $_.BaseName }

    $missing = Compare-Object $declared $actual |
        Where-Object SideIndicator -eq '=>'
    if ($missing) {
        throw "Manifest missing functions: $($missing.InputObject -join ', '). Run Update-ModuleManifest."
    }
}
```

## See Also

- [proj-psd1-not-edited](proj-psd1-not-edited.md) - Don't manually edit .psd1
- [mod-psm1-psd1](mod-psm1-psd1.md) - Separate code from manifest
