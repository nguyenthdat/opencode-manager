# test-mock-commands

> Use Mock to replace external commands

## Why It Matters

Unit tests must be isolated from external dependencies. `Mock` replaces any PowerShell command with a controlled stub — no real API calls, no file system writes, no database queries. This makes tests fast, deterministic, and independent of network or infrastructure state.

## Bad

```powershell
Describe 'Send-Notification' {
    It 'Sends notification' {
        # Actually sends email — slow, unreliable, sends real mail
        Send-Notification -To 'test@corp.com' -Subject 'Test' -Body 'Hello'
    }
}
```

## Good

```powershell
Describe 'Send-Notification' {
    BeforeAll {
        Mock Send-MailMessage { return @{ Status = 'Sent' } }
        Mock Write-EventLog { }
    }

    It 'Calls Send-MailMessage with correct parameters' {
        Send-Notification -To 'user@corp.com' -Subject 'Alert' -Body 'Server down'

        Should -Invoke Send-MailMessage -Times 1 -Exactly -ParameterFilter {
            $To -eq 'user@corp.com' -and
            $Subject -eq 'Alert' -and
            $Body -eq 'Server down'
        }
    }

    It 'Logs to EventLog on failure' {
        Mock Send-MailMessage { throw 'SMTP unavailable' }

        { Send-Notification -To 'user@corp.com' -Subject 'Test' -Body 'Test' } |
            Should -Throw

        Should -Invoke Write-EventLog -Times 1
    }
}
```

## Mock Patterns

```powershell
# Mock with return value
Mock Get-Content { return 'mocked content' }

# Mock with dynamic behavior
Mock Get-Date { return [DateTime]'2024-01-15' }

# Mock with conditional behavior
Mock Invoke-RestMethod {
    if ($Uri -like '*fail*') { throw 'Network error' }
    return @{ status = 'ok' }
} -ParameterFilter { $Method -eq 'Post' }

# Mock that asserts its own parameters
Mock Remove-Item {
    if ($Path -notlike '*.tmp') { throw "Unexpected path: $Path" }
}

# Remove mock after test
Mock SomeCommand { ... }
# ... tests ...
Assert-MockCalled SomeCommand
```

## See Also

- [test-should-invoke](test-should-invoke.md) - Should -Invoke
- [test-should-invoke-verifiable](test-should-invoke-verifiable.md) - Strict mock checking
