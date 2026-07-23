# test-describe-context

> Structure with Describe/Context/It blocks

## Why It Matters

Describe/Context/It blocks create a readable, hierarchical test structure that documents behavior. `Describe` groups related tests (a function), `Context` specifies conditions (input scenarios), and `It` asserts a single behavior. This BDD structure makes test output readable as documentation.

## Bad

```powershell
# Flat, unstructured tests
$result1 = Get-User -Id 1
if ($result1.Name -ne 'Alice') { throw "Test 1 failed" }

$result2 = Get-User -Id 1
if (-not $result2.Email) { throw "Test 2 failed" }

$result3 = Get-User -Id 999
if ($result3) { throw "Test 3 failed" }
```

## Good

```powershell
Describe 'Get-User' {

    Context 'When user exists' {
        BeforeAll {
            $user = Get-User -Id 1
        }

        It 'Returns user with correct name' {
            $user.Name | Should -Be 'Alice'
        }

        It 'Returns user with email' {
            $user.Email | Should -BeLike '*@*'
        }

        It 'Returns PSCustomObject' {
            $user | Should -BeOfType [PSCustomObject]
        }
    }

    Context 'When user does not exist' {
        It 'Returns null' {
            Get-User -Id 99999 | Should -BeNullOrEmpty
        }

        It 'Does not throw' {
            { Get-User -Id 99999 } | Should -Not -Throw
        }
    }

    Context 'With invalid Id parameter' {
        It 'Throws on negative value' {
            { Get-User -Id -1 } | Should -Throw
        }

        It 'Throws on zero' {
            { Get-User -Id 0 } | Should -Throw
        }
    }
}
```

## Describe/Context/It Rules

```powershell
# Describe: function or feature name
Describe 'Get-User' { ... }
Describe 'User Management Module' { ... }

# Context: a specific scenario or condition
Context 'When database is unavailable' { ... }
Context 'With valid input' { ... }
Context 'When running as non-admin' { ... }
Context 'With empty pipeline input' { ... }

# It: a single, specific behavior
It 'Returns the correct object type' { ... }
It 'Throws ArgumentException on null input' { ... }
It 'Writes verbose output with -Verbose' { ... }
It 'Calls Remove-Item with expected path' { ... }
```

## See Also

- [test-pester-framework](test-pester-framework.md) - Pester overview
- [test-before-each-after](test-before-each-after.md) - Fixture setup
