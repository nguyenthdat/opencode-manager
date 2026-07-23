# doc-readme-module

> README with install, examples, full command reference

## Why It Matters

The README is the first thing users see on GitHub, PSGallery, and your docs site. A good README converts browsers into users: it shows what the module does, how to install it, a quick example, and where to find more. Without one, your module looks abandoned or untrustworthy.

## Bad

```powershell
# No README.md, or just:
# MyModule
# PowerShell module for stuff.
```

## Good

````markdown
# MyModule

PowerShell module for automated Active Directory user lifecycle management.

## Installation

```powershell
Install-PSResource -Name MyModule -Repository PSGallery
```

Or from source:

```powershell
git clone https://github.com/myorg/MyModule.git
Import-Module ./MyModule/MyModule.psd1
```

## Quick Start

```powershell
# Find stale users (90+ days no login)
Get-StaleUser -DaysOld 90 | Disable-StaleUser

# Create onboarding batch
Import-Csv new-hires.csv | New-User -Department 'Engineering' -SendWelcomeEmail
```

## Requirements

- PowerShell 7.4+
- ActiveDirectory module
- Access to SecretManagement vault (for credentials)

## Command Reference

| Cmdlet | Description |
|--------|-------------|
| `Get-StaleUser` | Finds users inactive beyond threshold |
| `Disable-StaleUser` | Disables users (supports -WhatIf) |
| `New-User` | Creates AD user with standard attributes |
| `Remove-StaleUser` | Removes disabled users after retention period |

For full documentation: `Get-Help Get-StaleUser -Full`

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT
````

## See Also

- [doc-comment-based-help](doc-comment-based-help.md) - Function help
- [doc-about-topics](doc-about-topics.md) - About topics
