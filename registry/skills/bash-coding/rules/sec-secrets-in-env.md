# sec-secrets-in-env

> Pass secrets via environment, never CLI args

## Why It Matters

Command-line arguments are visible to all users on the system via `ps aux`, `/proc/*/cmdline`, process monitoring tools, and audit logs. Passing secrets (passwords, API keys, tokens) as CLI arguments exposes them to anyone with access to process listings. Environment variables are generally more private (not shown in `ps` by default), though they still have exposure risks in some tools.

## Bad

```bash
# Secrets in CLI args — visible in ps aux
mysql -u root -p"$PASSWORD" "$DB"
curl -H "Authorization: Bearer $TOKEN" "$API"
aws s3 cp "$file" s3://bucket/ --aws-access-key-id "$KEY" --aws-secret-access-key "$SECRET"

# In a script itself
API_KEY="sk-1234abcd"    # Hardcoded secret in source code!
curl -H "X-API-Key: $API_KEY" "$URL"
```

## Good

```bash
# Secrets via environment variables
export MYSQL_PWD="$PASSWORD"         # mysql reads MYSQL_PWD automatically
mysql -u root "$DB"

# Many tools read from env natively
export AWS_ACCESS_KEY_ID="$KEY"
export AWS_SECRET_ACCESS_KEY="$SECRET"
aws s3 cp "$file" s3://bucket/      # No secrets in args

# Load from secret manager or file
DB_PASSWORD="$(vault read -field=password secret/db)"  # HashiCorp Vault
API_KEY="$(gpg --decrypt secrets.gpg 2>/dev/null)"

# Feed via stdin or file descriptor
curl -H "Authorization: Bearer $(< /run/secrets/api_token)" "$URL"

# Unset after use
process_with_secret() {
    local secret
    secret="$(read_secret)" || return 1
    do_work "$secret"
    # secret goes out of scope when function returns
}
```

## Secret Management Hierarchy

1. Secret manager (Vault, AWS Secrets Manager, 1Password CLI)
2. Encrypted file (gpg, age, sops)
3. Environment variable (from CI/CD secret store)
4. File with restricted permissions (0400)
5. Never: CLI argument, hardcoded in script, git-committed

## See Also

- [sec-no-hardcoded-secrets](./sec-no-hardcoded-secrets.md) - Don't hardcode secrets
- [sec-umask-restrictive](./sec-umask-restrictive.md) - Restrictive file permissions
