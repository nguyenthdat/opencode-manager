# doc-examples-section

> Include .EXAMPLE with real usage

## Why It Matters

Examples are the most-read section of help — users copy-paste them to get started. Good examples show real-world scenarios, demonstrate parameter combinations, and illustrate pipeline usage. Without examples, users must reverse-engineer your function from parameter names.

## Bad

```powershell
<#
.EXAMPLE
    Get-User -Id 1
    Gets a user.
#>
```

## Good

```powershell
<#
.EXAMPLE
    Get-User -Identity jdoe
    Retrieves the user with SamAccountName 'jdoe' and returns common properties.

.EXAMPLE
    Get-User -Identity jdoe -Properties Department, Title, Manager
    Retrieves 'jdoe' with additional AD properties for department, job title,
    and manager information.

.EXAMPLE
    Get-ADGroupMember 'Engineering' | Get-User
    Retrieves all users who are members of the 'Engineering' group using pipeline input.

.EXAMPLE
    Get-User -Identity jdoe | Select-Object Name, Email, @{N='ManagerName'; E={ (Get-User $_.Manager).Name }}
    Retrieves jdoe and resolves their manager's display name using a calculated property.

.EXAMPLE
    $staleUsers = Get-User -Filter { LastLogonDate -lt (Get-Date).AddDays(-90) } |
        Where-Object Enabled
    Finds all enabled users who haven't logged in for 90 days.
#>
```

## Example Guidelines

```powershell
# Each example should:
# 1. Start with a comment describing what it demonstrates
# 2. Show realistic, copy-paste-able commands
# 3. Progress from simple to complex
# 4. Include pipeline examples when supported
# 5. Avoid placeholder values (use real-ish names)

# Good example pattern:
.EXAMPLE
    # Brief comment about the scenario
    Command -Parameter Value | Next-Command

.EXAMPLE
    # Advanced: combining with other cmdlets
    Get-Something | Where-Object Property -eq 'Value' | Your-Cmdlet -Switch
```

## See Also

- [doc-comment-based-help](doc-comment-based-help.md) - Comment-based help
- [doc-parameter-help](doc-parameter-help.md) - Parameter documentation
