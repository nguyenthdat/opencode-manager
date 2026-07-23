# test-should-invoke

> Use Should -Invoke to verify command calls

## Why It Matters

`Should -Invoke` (formerly `Assert-MockCalled`) verifies that a mocked command was called with the expected parameters and frequency. Without it, you're testing that your code didn't crash — not that it did the right thing. Mock verification catches logic errors where the right function is never called.

## Bad

```powershell
Describe 'Remove-StaleData' {
    BeforeAll {
        Mock Remove-Item { }
    }

    It 'Removes old files' {
        Remove-StaleData -Path './temp' -DaysOld 30
        # Test passes if no exception, but did Remove-Item actually run?
        # Could remove nothing and pass!
    }
}
```

## Good

```powershell
Describe 'Remove-StaleData' {
    BeforeAll {
        Mock Remove-Item { }
        Mock Get-ChildItem {
            return @(
                @{ Name = 'old.log'; LastWriteTime = (Get-Date).AddDays(-60); FullName = './temp/old.log' }
                @{ Name = 'recent.log'; LastWriteTime = (Get-Date).AddDays(-5); FullName = './temp/recent.log' }
            )
        }
    }

    It 'Removes only files older than threshold' {
        Remove-StaleData -Path './temp' -DaysOld 30

        Should -Invoke Remove-Item -Times 1 -Exactly -ParameterFilter {
            $Path -eq './temp/old.log'
        }
        Should -Invoke Remove-Item -Times 0 -ParameterFilter {
            $Path -eq './temp/recent.log'
        }
    }

    It 'Removes nothing when no stale files' {
        Mock Get-ChildItem { return @() }

        Remove-StaleData -Path './temp' -DaysOld 30

        Should -Invoke Remove-Item -Times 0 -Exactly
    }
}
```

## Should -Invoke Options

```powershell
Should -Invoke Remove-Item                           # Called at least once
Should -Invoke Remove-Item -Times 1 -Exactly          # Called exactly once
Should -Invoke Remove-Item -Times 3                   # Called at least 3 times
Should -Invoke Remove-Item -Times 0 -Exactly          # Never called
Should -Invoke Remove-Item -ParameterFilter { $Force } # Called with -Force
Should -Invoke Remove-Item -Scope It                  # Check per-test scope
```

## See Also

- [test-mock-commands](test-mock-commands.md) - Mock creation
- [test-should-invoke-verifiable](test-should-invoke-verifiable.md) - Strict verification
