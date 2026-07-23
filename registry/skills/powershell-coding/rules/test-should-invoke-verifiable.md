# test-should-invoke-verifiable

> Use Should -InvokeVerifiable for strict mock checking

## Why It Matters

`Should -InvokeVerifiable` enforces that every mock created with `-Verifiable` was actually called. This catches the case where you mock dependencies but your code silently skips them — a common bug after refactoring. Strict verification ensures your mocks match actual execution paths.

## Bad

```powershell
Describe 'Process-Order' {
    BeforeAll {
        # Mock created but might not be called — no enforcement
        Mock Send-OrderConfirmation { }
        Mock Update-Inventory { }
        Mock Charge-CreditCard { }
    }

    It 'Processes valid order' {
        Process-Order -OrderId 123
        # Test passes even if Charge-CreditCard was never called
        # Silent failure: order processed without payment!
    }
}
```

## Good

```powershell
Describe 'Process-Order' {
    BeforeAll {
        Mock Send-OrderConfirmation { } -Verifiable
        Mock Update-Inventory { } -Verifiable
        Mock Charge-CreditCard { } -Verifiable
    }

    It 'Processes valid order' {
        Process-Order -OrderId 123

        Should -InvokeVerifiable
        # Fails if ANY verifiable mock was not called
    }

    It 'Does not charge on free order' {
        Mock Charge-CreditCard { } -Verifiable
        # Override for this scenario

        Process-FreeOrder -OrderId 456

        # This will FAIL because Charge-CreditCard is verifiable but not called
        # Fix: remove -Verifiable or add Should -Invoke Charge-CreditCard -Times 0
    }
}
```

## Verifiable Mock Strategy

```powershell
# Use verifiable for critical side effects
Mock Send-NotificationEmail { } -Verifiable       # Must be called
Mock Write-AuditLog { } -Verifiable               # Must be called

# Use non-verifiable for optional helpers
Mock Write-Verbose { }                            # Optional — no enforcement
Mock Get-CachedValue { return $null }             # Cache miss is OK

# At end of each test:
Should -InvokeVerifiable  # Enforce all critical mocks were called
```

## See Also

- [test-should-invoke](test-should-invoke.md) - Should -Invoke
- [test-mock-commands](test-mock-commands.md) - Mock creation
