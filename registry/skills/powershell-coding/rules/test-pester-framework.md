# test-pester-framework

> Use Pester for PowerShell testing

## Why It Matters

Pester is the de facto standard testing framework for PowerShell — built into PowerShell, used by Microsoft for module testing, and understood by every PowerShell developer. It provides a BDD-style DSL with Describe/Context/It, mocks, assertions, code coverage, and CI integration. Alternatives don't exist with equivalent ecosystem support.

## Bad

```powershell
# No tests — quality unknown
# Manual testing:
Get-User -Id 1  # Looks right...

# Custom test script — no structure
$result = Get-User -Id 1
if ($result.Name -ne 'Alice') { Write-Host "FAIL" }

$result = Get-User -Id 999
if ($result) { Write-Host "FAIL: should be null" }
```

## Good

```powershell
# tests/Get-User.Tests.ps1
BeforeAll {
    . $PSScriptRoot/../Public/Get-User.ps1
}

Describe 'Get-User' {
    Context 'When user exists' {
        It 'Returns the correct user object' {
            $result = Get-User -Id 1

            $result | Should -Not -BeNullOrEmpty
            $result.Name | Should -Be 'Alice'
            $result | Should -BeOfType [PSCustomObject]
        }

        It 'Returns user with email' {
            $result = Get-User -Id 1
            $result.Email | Should -BeLike '*@*'
        }
    }

    Context 'When user does not exist' {
        It 'Returns null' {
            $result = Get-User -Id 99999
            $result | Should -BeNullOrEmpty
        }
    }

    Context 'With invalid input' {
        It 'Throws on negative Id' {
            { Get-User -Id -1 } | Should -Throw
        }

        It 'Throws on non-integer Id' {
            { Get-User -Id 'abc' } | Should -Throw
        }
    }
}

# Run: Invoke-Pester ./tests/
```

## Pester Quick Start

```powershell
# Install Pester (comes with pwsh 7.x)
Install-Module Pester -Force -SkipPublisherCheck

# Run all tests
Invoke-Pester ./tests/

# Run with verbose output
Invoke-Pester ./tests/ -Output Detailed

# Run specific tests
Invoke-Pester ./tests/Get-User.Tests.ps1

# Run with code coverage
Invoke-Pester ./tests/ -CodeCoverage ./Public/*.ps1
```

## See Also

- [test-describe-context](test-describe-context.md) - Test structure
- [test-assertion-operators](test-assertion-operators.md) - Should operators
