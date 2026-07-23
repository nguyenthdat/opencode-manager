# name-scripts-kebab-case

> Use kebab-case for script file names

## Why It Matters

kebab-case (`deploy-production.ps1`) is the standard for PowerShell script filenames — it's readable, cross-platform safe (no spaces, no case sensitivity issues), and matches the convention used by the PowerShell community. Spaces in filenames break command-line invocation, and CamelCase scripts feel like module names.

## Bad

```powershell
# Spaces — breaks command-line invocation
./My Deployment Script.ps1  # Requires quoting — error-prone

# CamelCase — looks like a module name
./DeployProduction.ps1      # Is this a module or script?

# Inconsistent
deploy_prod.ps1             # snake_case
Start-Process.ps1           # Verb-Noun for scripts
script.ps1                  # Too generic
```

## Good

```powershell
# kebab-case — standard, readable, safe
./deploy-production.ps1
./sync-users-from-ad.ps1
./backup-database.ps1
./new-user-onboarding.ps1
./test-api-endpoints.ps1
./clean-temp-files.ps1
```

## Script Naming Patterns

```powershell
# Action-oriented scripts
install-prerequisites.ps1
setup-development-environment.ps1
migrate-database.ps1
validate-deployment.ps1
health-check.ps1

# Scheduled task scripts
daily-backup.ps1
weekly-report.ps1
cleanup-logs.ps1

# Build/CI scripts
build.ps1
test.ps1
publish.ps1
deploy.ps1

# Never use Verb-Noun for scripts unless they're dot-sourced function collections
# Scripts are invoked, not imported — different lifecycle
```

## See Also

- [name-modules-PascalCase](name-modules-PascalCase.md) - Module naming
- [proj-ps1-psm1-separate](proj-ps1-psm1-separate.md) - Separate scripts from modules
