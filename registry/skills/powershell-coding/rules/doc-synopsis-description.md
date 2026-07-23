# doc-synopsis-description

> Include .SYNOPSIS and .DESCRIPTION sections

## Why It Matters

`.SYNOPSIS` is the first thing `Get-Help` displays — it's the function's elevator pitch. `.DESCRIPTION` provides the full context: what the function does, when to use it, limitations, and important behaviors. Together they answer the two questions every user asks: "What does this do?" and "Should I use it?"

## Bad

```powershell
<#
.SYNOPSIS
    Gets stuff.

.DESCRIPTION
    It does things.
#>
function Get-Data { ... }
# Get-Help shows useless information — user moves on
```

## Good

```powershell
<#
.SYNOPSIS
    Retrieves configuration data from Consul KV store and merges with local overrides.

.DESCRIPTION
    Get-ConsulConfig connects to the configured Consul cluster and retrieves all
    key-value pairs under the specified prefix. It then reads a local YAML override
    file and performs a deep merge, with local values taking precedence.

    The function automatically handles Consul ACL tokens via the SecretManagement
    module and caches results for 5 minutes to reduce load on the Consul cluster.

    Use this function during application startup to retrieve environment-specific
    configuration.
#>
function Get-ConsulConfig { ... }
```

## Synopsis Best Practices

```powershell
# .SYNOPSIS: one line, present tense, starts with approved verb
# Good:
.SYNOPSIS
    Retrieves user accounts that have not logged in for 90 days.

# Bad:
.SYNOPSIS
    This function will get the users who haven't logged in lately.

# .DESCRIPTION: full detail, multi-paragraph when needed
.DESCRIPTION
    Get-StaleAccounts queries Active Directory for user accounts whose
    LastLogonDate falls before the specified cutoff. It returns full user
    objects that can be piped to Disable-ADAccount or Remove-ADUser for
    bulk account management.

    By default, disabled accounts are excluded. Use the -IncludeDisabled
    switch to include them in the results. Service accounts (identified
    by Description containing 'SVC_') are always excluded.
```

## See Also

- [doc-comment-based-help](doc-comment-based-help.md) - Comment-based help
- [doc-parameter-help](doc-parameter-help.md) - Parameter documentation
