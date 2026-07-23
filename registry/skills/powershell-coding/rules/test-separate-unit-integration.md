# test-separate-unit-integration

> Tag tests as Unit/Integration

## Why It Matters

Tagging tests lets you run fast unit tests during development (seconds) and slower integration tests in CI (minutes). Without tags, you either skip testing during development or wait for integration tests on every local run. Tags also partition test responsibilities clearly.

## Bad

```powershell
Describe 'Database Operations' {
    It 'Creates a record' {
        $connection = Connect-Database -ConnectionString $env:DB_CS  # Real DB!
        New-DatabaseRecord -Connection $connection -Data $testData
        # Requires actual database — slow, environment-dependent
    }

    It 'Validates email format' {
        Test-Email 'user@corp.com' | Should -BeTrue  # Fast unit test
        Test-Email 'invalid' | Should -BeFalse
    }
}
# Slow DB test mixed with fast unit test — always slow
```

## Good

```powershell
# tests/Unit/Get-User.Tests.ps1
Describe 'Get-User' -Tag 'Unit' {
    BeforeAll {
        Mock Get-ADUser { return [PSCustomObject]@{ Name = 'Alice' } }
    }

    It 'Returns user by Id' {
        $result = Get-User -Id 1
        $result.Name | Should -Be 'Alice'
    }
}

# tests/Integration/Get-User.Tests.ps1
Describe 'Get-User' -Tag 'Integration' {
    It 'Retrieves real user from AD' {
        $result = Get-User -Id (Get-TestUser).SamAccountName
        $result | Should -Not -BeNullOrEmpty
        $result.Enabled | Should -BeTrue
    }
}

# Run only unit tests (fast, local dev)
Invoke-Pester ./tests/Unit/ -Tag Unit

# Run integration tests (CI, requires infrastructure)
Invoke-Pester ./tests/Integration/ -Tag Integration

# Run all (full CI pipeline)
Invoke-Pester ./tests/
```

## Test Tagging Strategy

```powershell
# Tag meanings:
# Unit        — no external dependencies, fast, deterministic
# Integration — requires external services (DB, API, AD)
# Smoke       — critical path only, run before deployment
# Slow        — takes > 1 second each
# Focus       — work-in-progress, never commit

Describe 'Database Module' -Tag 'Integration', 'Smoke' { ... }
Describe 'Unit Tests' -Tag 'Unit' { ... }

# CI pipeline:
# 1. Invoke-Pester -Tag Unit           (every commit)
# 2. Invoke-Pester -Tag Integration    (PR build)
# 3. Invoke-Pester -Tag Smoke          (pre-deployment)
```

## See Also

- [test-focus-danger](test-focus-danger.md) - Never commit Focus tags
- [test-pester-framework](test-pester-framework.md) - Pester overview
