# mod-test-layout

> Include tests/ directory; bundle Pester tests with module

## Why It Matters

Bundling tests with the module ensures they're always available — anyone who installs the module can run tests to verify it works in their environment. Separating tests from the module means they get lost, outdated, or never written. Tests alongside code are the industry standard for a reason.

## Bad

```
MyModule/
├── MyModule.psd1
├── MyModule.psm1
├── Public/
│   └── Get-Data.ps1
└── Private/
    └── Invoke-Something.ps1
# No tests anywhere — quality unknown
```

## Good

```
MyModule/
├── MyModule.psd1
├── MyModule.psm1
├── Public/
│   ├── Get-Data.ps1
│   └── Set-Data.ps1
├── Private/
│   └── Invoke-Something.ps1
└── tests/
    ├── Unit/
    │   ├── Get-Data.Tests.ps1
    │   ├── Set-Data.Tests.ps1
    │   └── Invoke-Something.Tests.ps1
    └── Integration/
        └── MyModule.Integration.Tests.ps1
```

## Test File Pattern

```powershell
# tests/Unit/Get-Data.Tests.ps1
Describe 'Get-Data' {
    BeforeAll {
        Import-Module "$PSScriptRoot/../../MyModule.psd1" -Force
    }

    Context 'When data exists' {
        It 'Returns expected object type' {
            $result = Get-Data -Id 1
            $result | Should -BeOfType [PSCustomObject]
        }

        It 'Throws on invalid Id' {
            { Get-Data -Id -1 } | Should -Throw
        }
    }
}

# Run all tests:
# Invoke-Pester ./tests/
```

## See Also

- [test-pester-framework](test-pester-framework.md) - Pester testing
- [test-separate-unit-integration](test-separate-unit-integration.md) - Test separation
