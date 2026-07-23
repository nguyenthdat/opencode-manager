# name-no-abbrev

> Avoid abbreviations except well-known (VM, DNS, IP, CSV)

## Why It Matters

Abbreviations create a private language that new team members must learn. `Get-ProcStat` could mean Process Status, Procedure State, or Procurement Station. Well-known acronyms (VM, DNS, IP, CSV, JSON) are fine because they're universally understood. When in doubt, spell it out.

## Bad

```powershell
function Get-ProcStat { ... }        # Process Status? Procedure State?
function Set-CfgVal { ... }          # Configuration Value?
function New-DBCnx { ... }           # Database Connection?
$usrAccnt = Get-ADUser               # User Account?
$tmpDir = "$env:TEMP\proc"           # Temporary Directory? Processing?
$errCnt = 0                          # Error Count?
```

## Good

```powershell
function Get-ProcessStatus { ... }
function Set-ConfigurationValue { ... }
function New-DatabaseConnection { ... }
$userAccount = Get-ADUser
$temporaryDirectory = "$env:TEMP\processing"
$errorCount = 0
```

## Well-Known Abbreviations (Acceptable)

```powershell
# Universally understood technical acronyms:
$vmName = 'prod-web-01'           # Virtual Machine
$dnsServer = '8.8.8.8'           # Domain Name System
$ipAddress = '192.168.1.1'       # Internet Protocol
$csvPath = './data.csv'          # Comma-Separated Values
$jsonBody = '{"key":"value"}'    # JavaScript Object Notation
$xmlDoc = [xml]'<root/>'         # Extensible Markup Language
$sqlQuery = 'SELECT * FROM ...'  # Structured Query Language
$htmlReport = '<h1>Report</h1>'  # HyperText Markup Language
$apiUri = 'https://api.example.com'  # Application Programming Interface

# When in doubt, ask: "Would a new team member know this abbreviation?"
```

## See Also

- [name-functions-Verb-Noun](name-functions-Verb-Noun.md) - Function naming
- [name-parameters-PascalCase](name-parameters-PascalCase.md) - Parameter naming
