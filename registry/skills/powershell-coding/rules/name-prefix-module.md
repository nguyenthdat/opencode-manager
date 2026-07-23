# name-prefix-module

> Use a short prefix for module-internal names

## Why It Matters

A short prefix (2-4 characters) on module-internal functions prevents name collisions when multiple modules are loaded in the same session. It also makes it obvious which module a function belongs to when reading code. Built-in modules demonstrate this: `AzStorage`, `ADUser`, `VMHost`.

## Bad

```powershell
# No prefix — collision risk
# Module A: function Get-Status { ... }
# Module B: function Get-Status { ... }
# Both loaded — which one runs?

# Generic names without module identity
function Get-Config { ... }    # Config of what?
function Set-LogLevel { ... }  # Which app?
function Connect-Server { ... } # Which server type?
```

## Good

```powershell
# Module: DataPipeline
# Prefix: DP

function Get-DPStatus { ... }
function Start-DPPipeline { ... }
function Stop-DPPipeline { ... }
function Get-DPMetrics { ... }

# Module: SecurityAudit
# Prefix: SA

function Invoke-SAScan { ... }
function Get-SAFinding { ... }
function Export-SAReport { ... }

# The prefix is part of the Noun, not the Verb
```

## Prefix Guidelines

```powershell
# Good prefixes — short, meaningful, uppercase
AD   # ActiveDirectory
Az   # Azure
VM   # VirtualMachine
DNS  # DnsServer
DP   # DataPipeline
SA   # SecurityAudit

# Avoid:
DataPipelineGet-Status  # Too long
dp-Get-Status           # Lowercase prefix — inconsistent
Get-DataPipelineStatus  # Too verbose (but OK for small modules)

# When your module name IS specific enough, no prefix needed
# Get-AzVM — Az is built-in
# Get-SqlDatabase — Sql is clear
```

## See Also

- [name-no-abbrev](name-no-abbrev.md) - Avoid abbreviations
- [mod-private-functions](mod-private-functions.md) - Private functions
