# test-assertion-operators

> Use Should -Be, -BeExactly, -BeLike, -Match

## Why It Matters

Pester's `Should` operators provide clear, semantic assertions that produce descriptive failure messages. Using PowerShell's native comparison operators (`-eq`, `-like`) inside tests produces vague "Expected $true but got $false" output. Should operators say exactly what went wrong.

## Bad

```powershell
Describe 'Get-User' {
    It 'Returns expected user' {
        $result = Get-User -Id 1
        $result.Name -eq 'Alice'           # Fails with: Expected $true, got $false
        $result.Age -ge 18                 # Vague failure
        $result.Email -match '@corp.com'   # No context on failure
    }
}
```

## Good

```powershell
Describe 'Get-User' {
    It 'Returns expected user' {
        $result = Get-User -Id 1

        # Exact match (string/number)
        $result.Name | Should -Be 'Alice'
        $result.Age | Should -Be 30

        # Type-sensitive exact match
        $result.Id | Should -BeExactly 1        # 1 (int) ≠ '1' (string)

        # Wildcard pattern
        $result.Email | Should -BeLike '*@corp.com'

        # Regex pattern
        $result.Phone | Should -Match '^\d{3}-\d{3}-\d{4}$'

        # Collection assertions
        $result.Tags | Should -Contain 'admin'
        $result.Permissions | Should -HaveCount 3

        # File/existence assertions
        './config.json' | Should -Exist
        './config.json' | Should -FileContentMatch 'connectionString'
    }
}
```

## Common Should Operators

```powershell
# Equality
$value | Should -Be $expected              # Case-insensitive
$value | Should -BeExactly $expected       # Case-sensitive, type-sensitive
$value | Should -Not -Be $unexpected

# Null/empty
$value | Should -BeNullOrEmpty
$value | Should -Not -BeNullOrEmpty

# Collections
$items | Should -HaveCount 5
$items | Should -Contain 'admin'
$items | Should -Not -Contain 'guest'

# Pattern matching
$string | Should -BeLike '*pattern*'
$string | Should -Match 'regex'
$string | Should -MatchExactly 'regex'     # Case-sensitive regex

# Type checking
$object | Should -BeOfType [PSCustomObject]
$object | Should -BeOfType 'System.String'
```

## See Also

- [test-pester-framework](test-pester-framework.md) - Pester overview
- [test-describe-context](test-describe-context.md) - Test structure
