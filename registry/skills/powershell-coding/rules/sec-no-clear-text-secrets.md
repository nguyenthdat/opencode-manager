# sec-no-clear-text-secrets

> Use SecretManagement module for secrets

## Why It Matters

Storing passwords, API keys, and connection strings in plain text in scripts or config files is the most common security vulnerability in PowerShell. The SecretManagement module provides a standardized, encrypted interface for secret storage backends (SecretStore, Azure Key Vault, HashiCorp Vault, KeePass).

## Bad

```powershell
# Plain text secrets in code
$apiKey = 'sk-abc123def456'
$password = 'P@ssw0rd!'
$connectionString = 'Server=db;User=admin;Password=secret'

Invoke-RestMethod -Uri $api -Headers @{ 'X-API-Key' = $apiKey }
Connect-Database -ConnectionString $connectionString

# Secrets in plain text config files
$config = Get-Content config.json | ConvertFrom-Json
$token = $config.api_key
```

## Good

```powershell
# Register a secret vault (once per machine)
Register-SecretVault -Name 'LocalStore' -ModuleName 'Microsoft.PowerShell.SecretStore' -DefaultVault
Set-SecretStoreConfiguration -Authentication Password

# Store secrets
Set-Secret -Name 'ApiKey' -Secret 'sk-abc123def456'
Set-Secret -Name 'DbPassword' -Secret 'supersecure'

# Retrieve secrets at runtime
$apiKey = Get-Secret -Name 'ApiKey' -AsPlainText
Invoke-RestMethod -Uri $api -Headers @{ 'X-API-Key' = $apiKey }

# Use PSCredential for passwords
$cred = Get-Secret -Name 'DbCredential' -Vault 'AzureKV'
# $cred is a PSCredential object — password is SecureString
```

## Also Use Environment Variables (CI/CD)

```powershell
# In CI/CD, use env vars with masking
$apiKey = $env:API_KEY

# Validate env var exists
if (-not $apiKey) {
    throw 'API_KEY environment variable is required'
}

# In GitHub Actions / Azure DevOps, secrets are automatically masked
Invoke-RestMethod -Uri $api -Headers @{ Authorization = "Bearer $env:GITHUB_TOKEN" }
```

## See Also

- [sec-secure-string](sec-secure-string.md) - SecureString for passwords
- [sec-no-hardcoded-creds](sec-no-hardcoded-creds.md) - No hardcoded credentials
