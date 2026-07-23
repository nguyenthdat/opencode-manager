# test-code-coverage

> Enable code coverage with -CodeCoverage

## Why It Matters

Code coverage measures which lines of your module actually execute during tests, revealing untested code paths, dead code, and forgotten edge cases. Pester's built-in coverage reports make it trivial to identify gaps. Ship modules with known coverage metrics.

## Bad

```powershell
# Running tests without coverage — blind spots
Invoke-Pester ./tests/
# All tests pass! But is everything really tested?
# No way to know which code paths were missed.
```

## Good

```powershell
# Run with code coverage
$coverageResult = Invoke-Pester ./tests/ -CodeCoverage ./Public/*.ps1

# Show coverage summary
$coverageResult.CodeCoverage |
    Select-Object File, @{N='Coverage%'; E={[math]::Round($_.PercentCoverage, 1)}}, *
    MissedCommands |
    Sort-Object PercentCoverage |
    Format-Table -AutoSize

# Show missed lines
$coverageResult.CodeCoverage |
    Where-Object { $_.MissedCommands.Count -gt 0 } |
    ForEach-Object {
        Write-Host "File: $($_.File)" -ForegroundColor Yellow
        foreach ($cmd in $_.MissedCommands) {
            Write-Host "  Line $($cmd.Line): $($cmd.Command)" -ForegroundColor Red
        }
    }

# Output paths
Function test-code-coverage.md
```

## Coverage in CI

```powershell
# In build.ps1
$pesterParams = @{
    Path         = './tests'
    CodeCoverage = './Public/*.ps1'
    OutputFile   = './test-results.xml'
    OutputFormat = 'NUnitXml'
    PassThru     = $true
}

$results = Invoke-Pester @pesterParams

# Fail build if coverage drops below threshold
$minCoverage = 80
$actualCoverage = ($results.CodeCoverage |
    Measure-Object -Property PercentCoverage -Average).Average

if ($actualCoverage -lt $minCoverage) {
    throw "Code coverage $actualCoverage% is below $minCoverage% threshold"
}

Write-Host "Coverage: $([math]::Round($actualCoverage, 1))%" -ForegroundColor Green
```

## See Also

- [test-pester-framework](test-pester-framework.md) - Pester overview
- [test-separate-unit-integration](test-separate-unit-integration.md) - Test categorization
