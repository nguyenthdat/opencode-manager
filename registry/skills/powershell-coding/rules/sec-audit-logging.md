# sec-audit-logging

> Enable ScriptBlock and Module logging for auditing

## Why It Matters

PowerShell logging is critical for security monitoring and incident response. ScriptBlock logging captures deobfuscated code before execution, Module logging records module usage, and Transcription creates full session transcripts. Without these, attackers can execute PowerShell payloads with no audit trail.

## Bad

```powershell
# No audit capability — scripts run invisibly
# Default logging: ScriptBlock and Module logging disabled
# Attacker's payload: no record of what ran
```

## Good

```powershell
# Enable via Group Policy (preferred) or registry:

# ScriptBlock Logging — captures all executed code (even obfuscated)
# HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging
# EnableScriptBlockLogging = 1
# EnableScriptBlockInvocationLogging = 1  # Also log invocation start/stop

# Module Logging — records pipeline execution
# HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging
# EnableModuleLogging = 1
# ModuleNames = '*'

# Transcription — full session transcript
# HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription
# EnableTranscripting = 1
# OutputDirectory = 'C:\PSTranscripts'
```

## Programmatic Logging from Scripts

```powershell
# Write custom audit events
function Write-AuditLog {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Action,

        [string]$Detail = '',
        [ValidateSet('Info', 'Warning', 'Critical')]
        [string]$Severity = 'Info'
    )

    $entry = [PSCustomObject]@{
        Timestamp = Get-Date -Format 'o'
        User      = $env:USERNAME
        Computer  = $env:COMPUTERNAME
        Action    = $Action
        Detail    = $Detail
        Severity  = $Severity
        Script    = $MyInvocation.ScriptName
    }

    # Windows Event Log
    Write-EventLog -LogName 'Application' -Source 'MyScript' `
        -EventId 1000 -EntryType Information `
        -Message ($entry | ConvertTo-Json -Compress)

    # Also log to central SIEM via structured file
    $entry | Export-Csv "$env:ProgramData\MyApp\audit.csv" -Append -NoTypeInformation
}

# Log critical operations
Write-AuditLog -Action 'UserDeleted' -Detail "User: $userId" -Severity Critical
```

## See Also

- [sec-execution-policy](sec-execution-policy.md) - Execution policy
- [err-log-errors](err-log-errors.md) - Error logging
