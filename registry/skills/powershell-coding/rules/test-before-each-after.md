# test-before-each-after

> Use BeforeEach/AfterEach for fixture setup

## Why It Matters

BeforeAll/BeforeEach/AfterEach/AfterAll provide deterministic test setup and cleanup. BeforeAll runs once per Describe block (shared state), BeforeEach runs before each It (isolated state). This eliminates duplicated setup code and ensures tests start from a clean state, preventing test interdependence.

## Bad

```powershell
Describe 'User Database' {
    It 'Creates a user' {
        $db = New-TestDatabase          # Duplicated setup
        $db.CreateUser('Alice')
        $db.GetUser('Alice').Name | Should -Be 'Alice'
        Remove-Item $db.Path -Force      # Duplicated cleanup
    }

    It 'Deletes a user' {
        $db = New-TestDatabase          # Duplicated setup again
        $db.CreateUser('Bob')
        $db.DeleteUser('Bob')
        $db.GetUser('Bob') | Should -BeNullOrEmpty
        Remove-Item $db.Path -Force      # Duplicated cleanup again
    }
}
```

## Good

```powershell
Describe 'User Database' {
    BeforeAll {
        # Runs once before all tests in this Describe
        $script:testDbPath = Join-Path $TestDrive 'test.db'
        $script:schema = Get-Content "$PSScriptRoot/../schema.sql" -Raw
    }

    BeforeEach {
        # Runs before every It — fresh state for each test
        $script:db = New-TestDatabase -Path $testDbPath -Schema $schema
    }

    AfterEach {
        # Runs after every It — clean up
        if ($script:db) {
            $script:db.Dispose()
        }
    }

    AfterAll {
        # Runs once after all tests
        if (Test-Path $testDbPath) {
            Remove-Item $testDbPath -Force
        }
    }

    It 'Creates a user' {
        $script:db.CreateUser('Alice')
        $script:db.GetUser('Alice').Name | Should -Be 'Alice'
    }

    It 'Deletes a user' {
        $script:db.CreateUser('Bob')
        $script:db.DeleteUser('Bob')
        $script:db.GetUser('Bob') | Should -BeNullOrEmpty
    }
}
```

## See Also

- [test-describe-context](test-describe-context.md) - Test structure
- [test-mock-commands](test-mock-commands.md) - Mock external commands
