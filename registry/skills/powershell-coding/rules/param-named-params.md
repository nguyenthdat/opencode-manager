# param-named-params

> Pass parameters by name for clarity at call site

## Why It Matters

Named parameters make code self-documenting — a reader can understand what each argument means without looking at the function definition. Positional arguments are a maintenance hazard: adding, removing, or reordering parameters breaks all call sites silently.

## Bad

```powershell
# What do these arguments mean?
Send-Notification 'jdoe' 'urgent' $true 'Server down!'

# Order-dependent — fragile
function Send-Notification {
    param($To, $Priority, $Html, $Body)
}
```

## Good

```powershell
# Named — self-documenting
Send-Notification -To 'jdoe' -Priority 'urgent' -Html:$true -Body 'Server down!'

# Order-independent — robust
Send-Notification -Body 'Server down!' -To 'jdoe' -Html:$true -Priority 'urgent'

# New parameters don't break existing calls
function Send-Notification {
    param($To, $Priority, $Html, $Body, $Cc, $Bcc)  # Added $Cc, $Bcc
}
# Old call site still works — $Cc and $Bcc default to $null
```

## Use Splatting for Many Parameters

```powershell
# Splatting — clean call site with named params
$mailParams = @{
    To       = 'jdoe@corp.com'
    Subject  = 'Deployment Status'
    Body     = Get-DeploymentReport
    Priority = 'High'
    SmtpServer = 'smtp.corp.com'
}
Send-MailMessage @mailParams

# Much cleaner than inline:
Send-MailMessage -To 'jdoe@corp.com' -Subject 'Deployment Status' `
    -Body (Get-DeploymentReport) -Priority 'High' -SmtpServer 'smtp.corp.com'
```

## See Also

- [param-splatting](param-splatting.md) - Splatting
- [param-no-position-binding](param-no-position-binding.md) - Positional parameters
