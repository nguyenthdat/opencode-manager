# anti-approve-all-confirm

> Don't use -Force to skip user prompts in scripts

## Why It Matters

`-Force` suppresses confirmation prompts and safety checks — it's the "I know what I'm doing" switch. Overusing `-Force` in scripts removes safety nets: overwriting files, deleting data, and making irreversible changes without any confirmation. Use `-Force` only when you've already validated the action is safe.

## Bad

```powershell
# Force everything — no safety checks
Get-ChildItem -Recurse | Remove-Item -Force       # Deletes without confirmation
Set-ExecutionPolicy Unrestricted -Force           # Disables security policy
Install-Module SomeModule -Force                  # Accepts untrusted module
Copy-Item src/* dest/ -Force                      # Overwrites files silently
```

## Good

```powershell
# Validate first, use -Force only when validated
$files = Get-ChildItem ./temp -Recurse
if ($files.Count -eq 0) {
    Write-Verbose "No files to clean"
    return
}

Write-Verbose "Removing $($files.Count) files"
$files | Remove-Item -Force  # OK: we know what we're removing

# For execution policy: use specific scope
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser  # No -Force — prompts if changing

# For module install: verify first
$module = Find-PSResource -Name SomeModule
if ($module.Publisher -ne 'Trusted Corp') {
    throw "Untrusted publisher: $($module.Publisher)"
}
Install-PSResource -Name SomeModule  # No -Force — trusted after verification
```

## When -Force Is Appropriate

```powershell
# Appropriate uses of -Force:
New-Item ./output -ItemType Directory -Force     # Create dir, no error if exists
Remove-Item ./temp/*.tmp -Force                  # After user confirmation, or in CI
Import-Module MyModule -Force                    # Reload during development
# Key: the caller has already decided the action is safe
```

## See Also

- [cmd-should-process](cmd-should-process.md) - WhatIf/Confirm support
- [sec-execution-policy](sec-execution-policy.md) - Execution policy
