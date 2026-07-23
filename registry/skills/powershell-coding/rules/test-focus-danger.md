# test-focus-danger

> Never commit -Tag 'Focus' or -ExcludeTag usage

## Why It Matters

`-Tag 'Focus'` or `-ExcludeTag` in source code restricts which tests run — if committed, CI runs a subset of tests and passes while other tests are broken. These are development conveniences that must be stripped before committing. A merged Focus tag silently disables test suites.

## Bad

```powershell
# NEVER commit these:
Describe 'Get-User' -Tag 'Focus' { ... }     # Only Focus tests run — others skipped
Describe 'Set-User' -Tag 'Unit', 'Focus' { ... }

# In build scripts:
Invoke-Pester -Tag 'Focus'      # Only focused tests!
Invoke-Pester -ExcludeTag 'Slow' # Skips slow tests!

# Result: CI passes, but half the tests never ran
```

## Good

```powershell
# Development: use Focus locally, NEVER commit
# Describe 'Get-User' -Tag 'Unit', 'Focus' { ... }  # TEMP: remove before commit

# In build scripts, always run full suite:
Invoke-Pester ./tests/

# Use a pre-commit hook to block Focus tags
# .git/hooks/pre-commit
if (Select-String -Path ./tests/**/*.Tests.ps1 -Pattern '-Tag.*Focus' -SimpleMatch) {
    Write-Error 'Focus tag found in tests! Remove before committing.'
    exit 1
}

# In CI, explicitly run ALL tests
$results = Invoke-Pester ./tests/ -PassThru
if ($results.FailedCount -gt 0) {
    throw "$($results.FailedCount) tests failed"
}
```

## Git Hook for Prevention

```powershell
# .git/hooks/pre-commit
#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

$focusFiles = Get-ChildItem -Path ./tests -Filter '*.Tests.ps1' -Recurse |
    Select-String -Pattern '-Tag.*[''"]Focus[''"]' -SimpleMatch

if ($focusFiles) {
    Write-Host "ERROR: Focus tag found in tests:" -ForegroundColor Red
    $focusFiles | ForEach-Object { Write-Host "  $($_.Path):$($_.LineNumber)" }
    exit 1
}
```

## See Also

- [test-separate-unit-integration](test-separate-unit-integration.md) - Test categorization
- [test-pester-framework](test-pester-framework.md) - Pester overview
