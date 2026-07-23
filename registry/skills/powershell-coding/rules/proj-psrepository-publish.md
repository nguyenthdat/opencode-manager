# proj-psrepository-publish

> Publish to PSRepository/PSGallery correctly

## Why It Matters

Publishing to PSGallery makes your module discoverable and installable via `Install-PSResource`. Incorrect publishing (wrong API key, missing metadata, unversioned packages) leads to failed installs, broken dependencies, and user frustration. A clean publish process ensures your module works for everyone.

## Bad

```powershell
# Manual, error-prone publish
Publish-Module -Path ./MyModule -NuGetApiKey $key
# Missing: version bump, manifest validation, test run, prerelease tags

# Publishing untested code
Publish-PSResource -Path ./MyModule  # No CI, no tests, no lint
```

## Good

```powershell
# Step-by-step publish in build.ps1

# 1. Validate manifest
$manifest = Test-ModuleManifest -Path ./MyModule/MyModule.psd1
if (-not $manifest) { throw 'Invalid module manifest' }

# 2. Run full test suite
$testResults = Invoke-Pester ./MyModule/tests -PassThru
if ($testResults.FailedCount -gt 0) {
    throw "$($testResults.FailedCount) tests failed"
}

# 3. Run analyzer
$analysis = Invoke-ScriptAnalyzer ./MyModule -Recurse -Severity Error
if ($analysis) { throw 'PSScriptAnalyzer found errors' }

# 4. Bump version (manual step — confirm with human)
Write-Host "Current version: $($manifest.Version)"
$newVersion = Read-Host 'New version'
Update-ModuleManifest -Path ./MyModule/MyModule.psd1 -ModuleVersion $newVersion

# 5. Publish
$publishParams = @{
    Path        = './MyModule'
    Repository  = 'PSGallery'
    ApiKey      = $env:PSGALLERY_API_KEY
}

if ($newVersion -match 'preview|beta|rc') {
    # Prerelease — installable with -Prerelease flag
    Publish-PSResource @publishParams -Prerelease
} else {
    Publish-PSResource @publishParams
}

Write-Host "Published MyModule v$newVersion to PSGallery" -ForegroundColor Green
```

## Repository Registration

```powershell
# Register PSGallery (once per machine)
Register-PSRepository -Default -InstallationPolicy Trusted

# Register private repository
Register-PSRepository -Name 'CorpGallery' `
    -SourceLocation 'https://nuget.corp.com/api/v2' `
    -PublishLocation 'https://nuget.corp.com/api/v2/package' `
    -InstallationPolicy Trusted

# Publish to private repo
Publish-PSResource -Path ./MyModule -Repository CorpGallery -ApiKey $env:NUGET_KEY
```

## See Also

- [proj-build-script](proj-build-script.md) - Build automation
- [mod-version-semantic](mod-version-semantic.md) - Semantic versioning
