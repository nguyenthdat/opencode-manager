# sec-secure-string

> Use SecureString or PSCredential for passwords

## Why It Matters

`SecureString` encrypts sensitive data in memory using DPAPI (Windows) or a platform-appropriate equivalent. Plain text strings linger in memory dumps, logs, and `$Error` records. `PSCredential` combines a username and `SecureString` password, providing a standard container for credentials that many PowerShell cmdlets natively accept.

## Bad

```powershell
# Plain text password in memory — visible in dump files
$password = 'MyP@ssw0rd!'
$credential = New-Object System.Management.Automation.PSCredential(
    'admin', ($password | ConvertTo-SecureString -AsPlainText -Force)
)

# Plain text in script
$connectionString = "Server=db;User=sa;Password=$password"
Invoke-SqlCmd -ConnectionString $connectionString
```

## Good

```powershell
# Prompt for password securely
$credential = Get-Credential -UserName 'admin' -Message 'Enter database password'

# Read from encrypted storage
$securePassword = Get-Secret -Name 'DbPassword'
$credential = [PSCredential]::new('admin', $securePassword)

# Pass credential to cmdlets (never extract plain text)
Invoke-SqlCmd -ServerInstance 'db-server' -Credential $credential -Query 'SELECT * FROM users'

# If cmdlet needs raw password (avoid when possible):
$ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $plainText = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    # Use $plainText immediately
} finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
```

## Exporting/Importing Secure Strings

```powershell
# Export to encrypted file (tied to current user/machine)
$credential.Password | ConvertFrom-SecureString | Out-File 'cred.enc'

# Import on same machine, same user
$securePassword = Get-Content 'cred.enc' | ConvertTo-SecureString
$credential = [PSCredential]::new('admin', $securePassword)

# Cross-machine: use certificate-based encryption
$cert = Get-ChildItem Cert:\CurrentUser\My\THUMBPRINT
$encrypted = $credential.Password |
    ConvertFrom-SecureString -SecureKey ( $cert.PublicKey.Key.Export('AES') )
```

## See Also

- [sec-no-clear-text-secrets](sec-no-clear-text-secrets.md) - SecretManagement
- [sec-no-hardcoded-creds](sec-no-hardcoded-creds.md) - Never in code
