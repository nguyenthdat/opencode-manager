# proj-build-script

> Provide build.ps1 for CI/CD

## Why It Matters

A `build.ps1` script standardizes the module's build process: lint, test, generate help, bump version, publish. CI/CD pipelines and contributors both run the same script — no guessing which commands to use. Without a build script, every team member and pipeline has their own ad-hoc process.

## Bad

```powershell
# No build script — everyone does something different
# Developer A: Invoke-Pester ./tests/
# Developer B: Invoke-Pester ./tests/ -Output Detailed -CodeCoverage
# CI: Invoke-ScriptAnalyzer ./MyModule; Invoke-Pester ./tests/; Publish-Module ...
# Inconsistent, error-prone, undocumented build process
```

## Good

```powershell
# build.ps1
[CmdletBinding()]
param(
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Debug',

    [switch]$Clean,

    [switch]$Publish
)

$ErrorActionPreference = 'Stop'
$script:ModuleName = 'MyModule'
$script:ModuleRoot = $PSScriptRoot

task Clean {
    if (Test-Path "$ModuleRoot/output") {
        Remove-Item "$ModuleRoot/output" -Recurse -Force
    }
}

task Analyze {
    Write-Host "Running PSScriptAnalyzer..." -ForegroundColor Cyan
    $results = Invoke-ScriptAnalyzer -Path "$ModuleRoot/$ModuleName" -Recurse -Severity Error,Warning
    if ($results) {
        $results | Format-Table RuleName, Line, Message
        throw "PSScriptAnalyzer found $($results.Count) issues"
    }
    Write-Host "Analysis passed" -ForegroundColor Green
}

task Test {
    Write-Host "Running Pester tests..." -ForegroundColor Cyan
    $testResults = Invoke-Pester "$ModuleRoot/tests" -PassThru
    if ($testResults.FailedCount -gt 0) {
        throw "$($testResults.FailedCount) tests failed"
    }
    Write-Host "All tests passed" -ForegroundColor Green
}

task BuildHelp {
    if (-not (Get-Module platyPS -ListAvailable)) {
        Install-Module platyPS -Scope CurrentUser -Force
    }
    Import-Module "$ModuleRoot/$ModuleName.psd1" -Force
    New-MarkdownHelp -Module $ModuleName -OutputFolder "$ModuleRoot/docs" -Force
    New-ExternalHelp -Path "$ModuleRoot/docs" -OutputPath "$ModuleRoot/$ModuleName/en-US" -Force
}

task Publish {
    $manifest = Import-PowerShellDataFile "$ModuleRoot/$ModuleName/$ModuleName.psd1"
    Write-Host "Publishing $ModuleName v$($manifest.ModuleVersion)..." -ForegroundColor Cyan
    Publish-PSResource -Path "$ModuleRoot/$ModuleName" -Repository PSGallery -ApiKey $env:PSGALLERY_KEY
}

# Execute tasks
if ($Clean) { Clean }
Analyze
Test
if ($Configuration -eq 'Release') {
    BuildHelp
    if ($Publish) { Publish }
}

Write-Host "Build complete!" -ForegroundColor Green
```

## See Also

- [proj-module-layout](proj-module-layout.md) - Module layout
- [mod-test-layout](mod-test-layout.md) - Test layout
