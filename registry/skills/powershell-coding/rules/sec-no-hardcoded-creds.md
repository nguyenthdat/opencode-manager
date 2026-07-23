# sec-no-hardcoded-creds

> Never store credentials in script files

## Why It Matters

Credentials in scripts are exposed in version control history, backups, screen captures, and shared code. Once committed to Git, they're forever retrievable — even if "deleted" later. Attackers actively scan public repos for passwords and API keys. Use SecretManagement, environment variables, or prompted input instead.

## Bad

```powershell
# Hardcoded credentials — visible to anyone who reads the script
$adminPassword = 'P@ssw0rd!'
$apiKey = 'sk-abc123def456'
$connectionString = 'Server=db;User=sa;Password=secret123'
$awsAccessKey = 'EXAMPLE_AWS_ACCESS_KEY'
$awsSecretKey = 'EXAMPLE_AWS_SECRET_KEY'

Connect-MgGraph -ClientId 'xxx' -TenantId 'xxx' -CertificateThumbprint 'xxx'
```

## Good

```powershell
# Prompt for credentials at runtime
$credential = Get-Credential -Message 'Enter admin credentials'

# Read from SecretManagement
$apiKey = Get-Secret -Name 'ApiKey' -AsPlainText

# Use environment variables (CI/CD with masked secrets)
$connectionString = $env:DB_CONNECTION_STRING
if (-not $connectionString) {
    throw 'DB_CONNECTION_STRING environment variable is required'
}

# Use certificate from store (no plain text)
$cert = Get-ChildItem Cert:\CurrentUser\My\THUMBPRINT
Connect-MgGraph -ClientId $env:CLIENT_ID -TenantId $env:TENANT_ID -Certificate $cert

# Use Azure Managed Identity (no credentials at all)
Connect-AzAccount -Identity
```

## What to Do If You Accidentally Commit Credentials

```powershell
# 1. Rotate the credential immediately — tokens/passwords are compromised
# 2. Rewrite git history (BFG Repo-Cleaner or git filter-branch)
# 3. Force-push the clean history
# 4. Alert security team

# Prevent with pre-commit hooks:
# .git/hooks/pre-commit
# Use detect-secrets, git-secrets, or gitleaks
```

## See Also

- [sec-no-clear-text-secrets](sec-no-clear-text-secrets.md) - SecretManagement
- [sec-secure-string](sec-secure-string.md) - SecureString usage
